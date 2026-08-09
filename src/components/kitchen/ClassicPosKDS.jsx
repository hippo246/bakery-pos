/**
 * ClassicPosKDS.jsx
 * High-contrast Digital KOT Rail for Kitchen Display System
 * CLASSIC POS THEME ONLY - Ultra-high contrast design for fast-paced kitchen operations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

export default function ClassicPosKDS({ kdsCards = [], setKdsCards, staff = [] }) {
  const [kotFilter, setKotFilter] = useState('ALL');
  const [currentTime, setCurrentTime] = useState('');
  const [lastPrintedKot, setLastPrintedKot] = useState(null);

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert real KDS cards to KOT format
  const allKOTs = useMemo(() => {
    return kdsCards.map(card => ({
      id: card.id,
      orderId: card.orderId,
      tableId: card.tableId || 'WALK-IN',
      orderType: card.orderType || 'DINE_IN',
      status: card.status || 'NEW',
      kotNumber: '1st KOT',
      staffName: staff.find(s => s.id === card.staffId)?.name || 'Kitchen',
      customerName: card.customerName || '',
      customerPhone: card.customerPhone || '',
      runningTime: Math.floor((Date.now() - (card.createdAt || Date.now())) / 60000),
      items: (card.items || []).map(item => ({
        name: item.name || item.menuItemName || 'Unknown Item',
        qty: item.qty || item.quantity || 1,
        modifiers: item.modifiers || [],
      })),
      createdAt: card.createdAt || Date.now(),
    }));
  }, [kdsCards, staff]);

  // Filter KOTs by type
  const filteredKOTs = useMemo(() => {
    if (kotFilter === 'ALL') return allKOTs;
    return allKOTs.filter(kot => kot.orderType === kotFilter);
  }, [allKOTs, kotFilter]);

  // Sort by running time (oldest first)
  const sortedKOTs = useMemo(() => {
    return [...filteredKOTs].sort((a, b) => b.runningTime - a.runningTime);
  }, [filteredKOTs]);

  // Get status color and styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'NEW':
      case 'PENDING':
        return {
          headerBg: '#00FF00',
          headerText: '#000000',
          isBlinking: true,
        };
      case 'PREPARING':
      case 'ACCEPTED':
        return {
          headerBg: '#FFA500',
          headerText: '#000000',
          isBlinking: false,
        };
      case 'READY':
        return {
          headerBg: '#FFFFFF',
          headerText: '#000000',
          isBlinking: false,
        };
      case 'SERVED':
      case 'COMPLETED':
        return {
          headerBg: '#808080',
          headerText: '#000000',
          isBlinking: false,
        };
      default:
        return {
          headerBg: '#FFFFFF',
          headerText: '#000000',
          isBlinking: false,
        };
    }
  };

  // Get order type icon
  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case 'DINE_IN': return '🪑';
      case 'TAKEAWAY': return '🥡';
      case 'DELIVERY': return '🛵';
      default: return '📋';
    }
  };

  // Mock printer function
  const printKOT = useCallback((kot) => {
    const printContent = `
================================
        KITCHEN ORDER TICKET
================================
ORDER ID: ${kot.orderId}
TABLE: ${kot.tableId}
TYPE: ${kot.orderType}
KOT #: ${kot.kotNumber}
STAFF: ${kot.staffName}
TIME: ${kot.runningTime}m ago
================================
${kot.customerName ? `CUSTOMER: ${kot.customerName}` : ''}
${kot.customerPhone ? `PHONE: ${kot.customerPhone}` : ''}
================================
ITEMS:
--------------------------------
${kot.items.map(item => {
  const modifierText = item.modifiers.length > 0 ? `  (${item.modifiers.join(', ')})` : '';
  return `${item.qty}x  ${item.name}${modifierText}`;
}).join('\n')}
================================
TOTAL ITEMS: ${kot.items.reduce((sum, item) => sum + item.qty, 0)}
PRINTED: ${new Date().toLocaleTimeString()}
================================
`;
    console.log(`KOT ${kot.tableId} printed to Kitchen 1`);
    console.log(printContent);
    setLastPrintedKot(kot);
    
    // Open in new tab (simulating print preview)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre;">${printContent}</pre>`);
      printWindow.document.close();
    }
  }, []);

  // Update KOT status
  const updateKOTStatus = useCallback((kotId, newStatus) => {
    if (setKdsCards) {
      setKdsCards(prev => prev.map(card => 
        card.id === kotId ? { ...card, status: newStatus } : card
      ));
    }
  }, [setKdsCards]);

  // Handle card actions
  const handlePrint = useCallback((kot) => {
    printKOT(kot);
  }, [printKOT]);

  const handleBump = useCallback((kot) => {
    updateKOTStatus(kot.id, 'READY');
  }, [updateKOTStatus]);

  const handleComplete = useCallback((kot) => {
    updateKOTStatus(kot.id, 'SERVED');
  }, [updateKOTStatus]);

  // Reprint last KOT
  const handleReprintLast = useCallback(() => {
    if (lastPrintedKot) {
      printKOT(lastPrintedKot);
    }
  }, [lastPrintedKot, printKOT]);

  // Print all active KOTs
  const handlePrintActive = useCallback(() => {
    const activeKOTs = sortedKOTs.filter(kot => 
      kot.status === 'NEW' || 
      kot.status === 'PENDING' || 
      kot.status === 'PREPARING' || 
      kot.status === 'ACCEPTED'
    );
    activeKOTs.forEach(kot => printKOT(kot));
  }, [sortedKOTs, printKOT]);

  // Clear completed KOTs
  const handleClearCompleted = useCallback(() => {
    if (setKdsCards) {
      setKdsCards(prev => prev.filter(card => 
        card.status !== 'SERVED' && 
        card.status !== 'COMPLETED' && 
        card.status !== 'CANCELLED'
      ));
    }
  }, [setKdsCards]);

  // Main styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const topBarStyle = {
    height: '10%',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
  };

  const titleSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '2px',
    color: '#FFFFFF',
  };

  const clockStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#00FF00',
    fontFamily: 'monospace',
  };

  const filterSectionStyle = {
    display: 'flex',
    gap: '8px',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '800',
    backgroundColor: isActive ? '#FFFFFF' : '#333333',
    color: isActive ? '#000000' : '#FFFFFF',
    border: isActive ? '3px solid #FFFFFF' : '2px solid #666666',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  });

  const actionSectionStyle = {
    display: 'flex',
    gap: '12px',
  };

  const actionButtonStyle = (color) => ({
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '800',
    backgroundColor: color,
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  });

  const mainBodyStyle = {
    height: '90%',
    display: 'flex',
    flexDirection: 'row',
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '16px',
    gap: '16px',
    backgroundColor: '#000000',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'auto',
    scrollbarColor: '#FFFFFF #000000',
  };

  const kotCardStyle = (status) => {
    const statusStyle = getStatusStyle(status);
    return {
      minWidth: '320px',
      maxWidth: '320px',
      backgroundColor: '#000000',
      border: '4px solid #FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    };
  };

  const kotHeaderStyle = (status) => {
    const statusStyle = getStatusStyle(status);
    return {
      backgroundColor: statusStyle.headerBg,
      color: statusStyle.headerText,
      padding: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: statusStyle.isBlinking ? 'blink 1s infinite' : 'none',
    };
  };

  const kotBodyStyle = {
    padding: '12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const orderInfoRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFFFFF',
    borderBottom: '2px solid #333333',
    paddingBottom: '8px',
  };

  const customerInfoStyle = {
    fontSize: '18px',
    fontWeight: '800',
    color: '#00FF00',
    marginBottom: '4px',
  };

  const customerPhoneStyle = {
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '8px',
  };

  const itemGridStyle = {
    display: 'grid',
    gridTemplateColumns: '60px 1fr',
    gap: '8px',
    flex: 1,
  };

  const itemQtyStyle = (qty) => ({
    fontSize: qty >= 5 ? '28px' : '24px',
    fontWeight: '900',
    color: qty >= 5 ? '#FF0000' : '#FFFFFF',
    textAlign: 'right',
  });

  const itemNameStyle = {
    fontSize: '20px',
    fontWeight: '800',
    color: '#FFFFFF',
  };

  const modifierStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#FFFF00',
    gridColumn: '2',
    marginLeft: '8px',
  };

  const kotFooterStyle = {
    display: 'flex',
    gap: '4px',
    padding: '8px',
    borderTop: '3px solid #FFFFFF',
  };

  const footerButtonStyle = (color) => ({
    flex: 1,
    padding: '16px 8px',
    fontSize: '14px',
    fontWeight: '900',
    backgroundColor: color,
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
 textAlign: 'center',
  });

  return (
    <div style={containerStyle}>
      {/* CSS Animation for blinking and scrollbar styling */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .kot-rail::-webkit-scrollbar {
          height: 16px;
        }
        .kot-rail::-webkit-scrollbar-track {
          background: #000000;
          border: 2px solid #333333;
        }
        .kot-rail::-webkit-scrollbar-thumb {
          background: #FFFFFF;
          border: 2px solid #000000;
          border-radius: 8px;
        }
        .kot-rail::-webkit-scrollbar-thumb:hover {
          background: #CCCCCC;
        }
      `}</style>
      
      {/* TOP BAR */}
      <div style={topBarStyle}>
        {/* Left: Title & Clock */}
        <div style={titleSectionStyle}>
          <div style={titleStyle}>KITCHEN LIVE KOT</div>
          <div style={clockStyle}>{currentTime}</div>
        </div>

        {/* Center: KOT Type Filters */}
        <div style={filterSectionStyle}>
          <button
            onClick={() => setKotFilter('ALL')}
            style={filterButtonStyle(kotFilter === 'ALL')}
          >
            ALL KOTs
          </button>
          <button
            onClick={() => setKotFilter('DINE_IN')}
            style={filterButtonStyle(kotFilter === 'DINE_IN')}
          >
            DINE-IN
          </button>
          <button
            onClick={() => setKotFilter('TAKEAWAY')}
            style={filterButtonStyle(kotFilter === 'TAKEAWAY')}
          >
            TAKEAWAY
          </button>
          <button
            onClick={() => setKotFilter('DELIVERY')}
            style={filterButtonStyle(kotFilter === 'DELIVERY')}
          >
            DELIVERY
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div style={actionSectionStyle}>
          <button
            onClick={handleReprintLast}
            style={actionButtonStyle('#CCCCCC')}
          >
            REPRINT LAST KOT
          </button>
          <button
            onClick={handlePrintActive}
            style={actionButtonStyle('#00FF00')}
          >
            PRINT ACTIVE KOTs
          </button>
          <button
            onClick={handleClearCompleted}
            style={actionButtonStyle('#FF0000')}
          >
            CLEAR COMPLETED
          </button>
        </div>
      </div>

      {/* MAIN BODY - KOT RAIL */}
      <div className="kot-rail" style={mainBodyStyle}>
        {sortedKOTs.map(kot => {
          const statusStyle = getStatusStyle(kot.status);
          return (
            <div key={kot.id} style={kotCardStyle(kot.status)}>
              {/* Card Header */}
              <div style={kotHeaderStyle(kot.status)}>
                <div style={{ fontSize: '24px', fontWeight: '900' }}>
                  {kot.tableId} / #{kot.orderId.slice(-4)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800' }}>
                  {kot.kotNumber} {getOrderTypeIcon(kot.orderType)}
                </div>
              </div>

              {/* Card Body */}
              <div style={kotBodyStyle}>
                {/* Order Info Row */}
                <div style={orderInfoRowStyle}>
                  <span>Waiter: {kot.staffName}</span>
                  <span>{kot.runningTime}m ago</span>
                </div>

                {/* Customer Info (for delivery/takeaway) */}
                {(kot.orderType === 'DELIVERY' || kot.orderType === 'TAKEAWAY') && (
                  <>
                    {kot.customerName && (
                      <div style={customerInfoStyle}>CUST: {kot.customerName}</div>
                    )}
                    {kot.customerPhone && (
                      <div style={customerPhoneStyle}>{kot.customerPhone}</div>
                    )}
                  </>
                )}

                {/* Item Grid */}
                <div style={itemGridStyle}>
                  {kot.items.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div style={itemQtyStyle(item.qty)}>
                        {item.qty}x
                      </div>
                      <div>
                        <div style={itemNameStyle}>{item.name}</div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div style={modifierStyle}>
                            {item.modifiers.join(', ')}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Card Footer Action Bar */}
              <div style={kotFooterStyle}>
                <button
                  onClick={() => handlePrint(kot)}
                  style={footerButtonStyle('#CCCCCC')}
                >
                  PRINT
                </button>
                <button
                  onClick={() => handleBump(kot)}
                  style={footerButtonStyle('#FFA500')}
                  disabled={kot.status === 'READY' || kot.status === 'SERVED' || kot.status === 'COMPLETED' || kot.status === 'CANCELLED'}
                >
                  BUMP / READY
                </button>
                <button
                  onClick={() => handleComplete(kot)}
                  style={footerButtonStyle('#00FF00')}
                  disabled={kot.status === 'SERVED' || kot.status === 'COMPLETED' || kot.status === 'CANCELLED'}
                >
                  COMPLETE / SERVE
                </button>
              </div>
            </div>
          );
        })}

        {sortedKOTs.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: '32px',
            fontWeight: '900',
            color: '#666666',
          }}>
            NO ACTIVE KOTs
          </div>
        )}
      </div>
    </div>
  );
}
