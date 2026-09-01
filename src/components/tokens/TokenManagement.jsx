import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TokenManagement({ orders, setOrders, onNavigate, darkMode = true }) {
  const [displayMode, setDisplayMode] = useState('display'); // 'display' or 'history'
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [selectedToken, setSelectedToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [qrOrders, setQROrders] = useState([]);
  const [tvMode, setTvMode] = useState(false);
  const [tvAuthRequired, setTvAuthRequired] = useState(true);
  const [tvPin, setTvPin] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');

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
    const interval = setInterval(loadQROrders, 30000); // Increased from 3s to 30s to reduce CPU usage

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

  const handleTvModeToggle = () => {
    if (tvMode) {
      setTvMode(false);
      setTvAuthRequired(true);
    } else {
      setShowAuthModal(true);
      setTvPin('');
      setAuthError('');
    }
  };

  const handleAuthSubmit = () => {
    const storedPin = localStorage.getItem('tv_mode_pin') || '1234';
    if (tvPin === storedPin) {
      setTvMode(true);
      setShowAuthModal(false);
      setTvAuthRequired(false);
      setTvPin('');
      setAuthError('');
    } else {
      setAuthError('Incorrect PIN');
    }
  };

  const handleExitTvMode = () => {
    setTvMode(false);
    setTvAuthRequired(true);
  };

  return (
    <>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#000000' : '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Content */}
      <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: darkMode ? '#000000' : '#f1f5f9' }}>
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
              color: darkMode ? '#ffffff' : '#0a0a0a',
              margin: 0,
              marginBottom: '4px'
            }}>
              🎫 Token Management
            </h1>
            <p style={{
              fontSize: screenSize === 'small' ? '13px' : '14px',
              color: darkMode ? '#888888' : '#888888',
              margin: 0
            }}>
              Manage and track customer tokens
            </p>
          </div>
          <button
            onClick={handleTvModeToggle}
            style={{
              padding: '12px 20px',
              background: tvMode ? '#ef4444' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
            }}
          >
            {tvMode ? '🚫 Exit TV Mode' : '📺 TV Mode'}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: screenSize === 'small' ? '12px' : '20px',
          marginBottom: screenSize === 'small' ? '20px' : '28px'
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '8px', fontWeight: '500' }}>
              ⏳ Pending
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#f59e0b' }}>
              {pendingTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '8px', fontWeight: '500' }}>
              👨‍🍳 Preparing
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#3b82f6' }}>
              {preparingTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '8px', fontWeight: '500' }}>
              ✅ Ready
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#10b981' }}>
              {readyTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '8px', fontWeight: '500' }}>
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
              background: darkMode ? '#111111' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '8px' }}>
                No active tokens
              </div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#888888' }}>
                Tokens will appear here when orders are placed
              </div>
            </div>
          ) : (
            tokens.map(token => (
              <div
                key={token.id}
                style={{
                  background: darkMode ? '#111111' : '#ffffff',
                  borderRadius: '16px',
                  border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    marginBottom: '4px'
                  }}>
                    {token.customerName || 'Walk-in'}
                  </div>
                  {token.tableNumber && (
                    <div style={{
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      color: darkMode ? '#888888' : '#888888',
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
                  background: darkMode ? '#000000' : '#f9fafb',
                  borderRadius: '12px',
                  marginBottom: screenSize === 'small' ? '12px' : '16px'
                }}>
                  <div style={{
                    fontSize: screenSize === 'small' ? '12px' : '13px',
                    color: darkMode ? '#888888' : '#888888',
                    marginBottom: '4px'
                  }}>
                    {token.items?.length || 0} items
                  </div>
                  <div style={{
                    fontSize: screenSize === 'small' ? '18px' : '20px',
                    fontWeight: '700',
                    color: darkMode ? '#ffffff' : '#0a0a0a'
                  }}>
                    ₹{token.total?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Time */}
                <div style={{
                  fontSize: screenSize === 'small' ? '11px' : '12px',
                  color: darkMode ? '#888888' : '#888888',
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
            background: darkMode ? '#111111' : '#ffffff',
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
              borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  🎫 Token {selectedToken.token}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: darkMode ? '#888888' : '#888888',
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
                  background: darkMode ? '#000000' : '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = darkMode ? '#000000' : '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = darkMode ? '#000000' : '#f3f4f6'}
              >
                ✕
              </button>
            </div>

            {/* Token Number */}
            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: darkMode ? '#000000' : '#f3f4f6',
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '8px', fontWeight: '500' }}>
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
              <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#888888', marginBottom: '6px', fontWeight: '500' }}>
                👤 Customer
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                {selectedToken.customerName || 'Walk-in'}
              </div>
              {selectedToken.customerPhone && (
                <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#888888' }}>
                  📞 {selectedToken.customerPhone}
                </div>
              )}
            </div>

            {/* Table */}
            {selectedToken.tableNumber && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#888888', marginBottom: '6px', fontWeight: '500' }}>
                  🪑 Table
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                  {selectedToken.tableNumber}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#888888', marginBottom: '12px', fontWeight: '500' }}>
                📦 Order Items
              </div>
              {selectedToken.items && selectedToken.items.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '16px',
                    background: darkMode ? '#000000' : '#f9fafb',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', fontSize: '15px' }}>
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
                        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888', marginTop: '4px' }}>
                          📝 {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                      <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                        {item.qty || item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#888888' }}>
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
              background: darkMode ? '#000000' : '#f3f4f6',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
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
                  background: darkMode ? '#222222' : '#e5e7eb',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = darkMode ? '#222222' : '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = darkMode ? '#222222' : '#e5e7eb';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* TV Mode View */}
    {tvMode && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px'
      }}>
        {/* TV Mode Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '2px solid #333'
        }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0
            }}>
              🎫 Token Display
            </h1>
            <p style={{
              fontSize: '20px',
              color: '#888888',
              margin: '8px 0 0 0'
            }}>
              {new Date().toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleExitTvMode}
            style={{
              padding: '16px 32px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🚫 Exit
          </button>
        </div>

        {/* TV Mode Token Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          flex: 1,
          overflow: 'auto'
        }}>
          {tokens.filter(t => t.status === 'PENDING' || t.status === 'PREPARING').map(token => (
            <div
              key={token.id}
              style={{
                background: '#111111',
                borderRadius: '20px',
                padding: '40px',
                border: `3px solid ${
                  token.status === 'PENDING' ? '#f59e0b' :
                  token.status === 'PREPARING' ? '#3b82f6' :
                  token.status === 'READY' ? '#10b981' : '#666666'
                }`,
                boxShadow: `0 0 30px ${
                  token.status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' :
                  token.status === 'PREPARING' ? 'rgba(59, 130, 246, 0.3)' :
                  token.status === 'READY' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                }`
              }}
            >
              <div style={{
                fontSize: '72px',
                fontWeight: '800',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                {token.token}
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: token.status === 'PENDING' ? '#f59e0b' :
                       token.status === 'PREPARING' ? '#3b82f6' :
                       token.status === 'READY' ? '#10b981' : '#666666',
                textAlign: 'center',
                marginBottom: '20px',
                padding: '12px 24px',
                borderRadius: '12px',
                background: token.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' :
                           token.status === 'PREPARING' ? 'rgba(59, 130, 246, 0.1)' :
                           token.status === 'READY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }}>
                {token.status}
              </div>
              {token.tableNumber && (
                <div style={{
                  fontSize: '24px',
                  color: '#888888',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  🪑 Table {token.tableNumber}
                </div>
              )}
              <div style={{
                fontSize: '20px',
                color: '#666666',
                textAlign: 'center'
              }}>
                {token.items?.length || 0} items • ₹{token.total?.toFixed(2) || '0.00'}
              </div>
            </div>
          ))}
        </div>

        {/* TV Mode Stats Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          padding: '30px',
          background: '#111111',
          borderRadius: '16px',
          marginTop: '30px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#f59e0b' }}>
              {pendingTokens}
            </div>
            <div style={{ fontSize: '18px', color: '#888888' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#3b82f6' }}>
              {preparingTokens}
            </div>
            <div style={{ fontSize: '18px', color: '#888888' }}>Preparing</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#10b981' }}>
              {readyTokens}
            </div>
            <div style={{ fontSize: '18px', color: '#888888' }}>Ready</div>
          </div>
        </div>
      </div>
    )}

    {/* Authentication Modal */}
    {showAuthModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: darkMode ? '#111111' : '#ffffff',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#0a0a0a',
            margin: '0 0 8px 0'
          }}>
            🔐 TV Mode Authentication
          </h2>
          <p style={{
            fontSize: '14px',
            color: darkMode ? '#888888' : '#888888',
            margin: '0 0 24px 0'
          }}>
            Enter PIN to enable TV display mode
          </p>
          <input
            type="password"
            value={tvPin}
            onChange={(e) => setTvPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()}
            placeholder="Enter PIN (default: 1234)"
            maxLength={4}
            style={{
              width: '100%',
              padding: '16px',
              background: darkMode ? '#000000' : '#f9fafb',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              border: `2px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '20px',
              letterSpacing: '8px',
              textAlign: 'center',
              outline: 'none',
              marginBottom: '16px'
            }}
            autoFocus
          />
          {authError && (
            <div style={{
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {authError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                flex: 1,
                padding: '16px',
                background: darkMode ? '#222222' : '#e5e7eb',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAuthSubmit}
              style={{
                flex: 1,
                padding: '16px',
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    )}
</>
  );
}
