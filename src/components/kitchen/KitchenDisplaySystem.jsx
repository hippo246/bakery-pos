// Kitchen Display System (KDS)
// Real-time display of Kitchen Order Tickets for kitchen staff

import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_PRINTERS, 
  KITCHEN_FILTER_DEFAULTS 
} from '../../data/mockData/kitchenData';
import { getKOTManager } from '../../operations/KOTManager.js';
import { KOTStatus, KOTPriority, KitchenStation } from '../../domain/kotTypes.js';

export default function KitchenDisplaySystem({ screenSize = 'large', orders = [], setOrders, settings = {}, onSettingsChange, menuItems = [] }) {
  const [kotManager] = useState(() => getKOTManager());
  const [kots, setKots] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [selectedStation, setSelectedStation] = useState(KITCHEN_FILTER_DEFAULTS.station);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(KITCHEN_FILTER_DEFAULTS.status);
  const [selectedOrderTypeFilter, setSelectedOrderTypeFilter] = useState(KITCHEN_FILTER_DEFAULTS.orderType);
  const [showPrinterSelect, setShowPrinterSelect] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(KITCHEN_FILTER_DEFAULTS.printer);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAllDayPrep, setShowAllDayPrep] = useState(false);
  const audioRef = useRef(null);

  const displaySettings = settings.display || {};
  const orderManagementSettings = settings.orderManagement || {};
  const stationSettings = settings.stations || {};
  const notificationSettings = settings.notifications || {};
  const performanceSettings = settings.performance || {};
  const advancedSettings = settings.advanced || {};

  const [printers, setPrinters] = useState(DEFAULT_PRINTERS);

  const loadKOTs = () => {
    try {
      const allKOTs = kotManager.getAllKOTs();
      console.log('Loading KOTs:', allKOTs.length);
      
      // Also check for QR orders
      try {
        const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        const pendingQROrders = qrOrders.filter(order => order.status === 'PENDING');
        
        pendingQROrders.forEach(qrOrder => {
          const existingKOT = allKOTs.find(kot => kot.orderNumber === qrOrder.id);
          if (!existingKOT) {
            const orderData = {
              orderId: `QR-${qrOrder.id}`,
              orderNumber: qrOrder.id,
              items: (qrOrder.items || []).map(item => ({
                id: item.id,
                name: item.name,
                quantity: parseInt(item.qty || item.quantity) || 1,
                price: parseFloat(item.price) || 0,
                category: item.category || 'General',
                notes: item.notes || ''
              })),
              customerName: qrOrder.customerName,
              tableNumber: qrOrder.tableName || 'QR Order',
              createdAt: qrOrder.createdAt,
              token: qrOrder.token || null,
              orderType: 'qr'
            };
            
            const res = kotManager.createKOT(orderData);
            if (res.success && res.kot) {
              res.kot.isQROrder = true;
              if (qrOrder.createdAt) {
                res.kot.createdAt = qrOrder.createdAt;
              }
              kotManager.kots.set(res.kot.kotId, res.kot);
              kotManager.saveState();

              // Auto-print KOT if enabled in settings
              const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
              if (mainSettings.autoPrintKOT !== false) {
                console.log('Auto-printing KOT for QR order:', res.kot.kotId);
                // Print KOT - you can implement thermal printer printing here
                setTimeout(() => {
                  window.print();
                }, 500);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error processing QR orders:', error);
      }

      const updatedKOTs = kotManager.getAllKOTs();
      
      let filteredKOTs = updatedKOTs;
      
      if (selectedStation !== 'all') {
        filteredKOTs = filteredKOTs.filter(kot => kot.station === selectedStation);
      }
      
      if (selectedStatusFilter !== 'all') {
        filteredKOTs = filteredKOTs.filter(kot => kot.status === selectedStatusFilter);
      }
      
      if (selectedOrderTypeFilter !== 'all') {
        filteredKOTs = filteredKOTs.filter(kot => {
          if (selectedOrderTypeFilter === 'qr') return kot.isQROrder;
          if (kot.orderType) return kot.orderType.toLowerCase() === selectedOrderTypeFilter;
          return false;
        });
      }

      setKots(filteredKOTs);
      setStatistics({
        active: filteredKOTs.filter(k => k.status !== 'COMPLETED' && k.status !== 'SERVED').length,
        byStatus: {
          pending: filteredKOTs.filter(k => k.status === 'PENDING').length
        },
        overdue: filteredKOTs.filter(k => {
          if (k.estimatedReadyAt) {
            return new Date() > new Date(k.estimatedReadyAt) && k.status !== 'SERVED';
          }
          return false;
        }).length
      });
    } catch (error) {
      console.error('Error loading KOTs:', error);
      setKots([]);
    }
  };

  const loadStatistics = () => {
    try {
      const stats = kotManager.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleKOTStatusChange = (kotId, newStatus) => {
    try {
      kotManager.updateKOTStatus(kotId, newStatus);
      setKots(prev => prev.map(k =>
        k.kotId === kotId ? { ...k, status: newStatus, updatedAt: new Date().toISOString() } : k
      ));
    } catch (error) {
      console.error('Error updating KOT status:', error);
    }
  };

  const handleMarkUrgent = (kotId) => {
    try {
      kotManager.markAsUrgent(kotId);
      setKots(prev => prev.map(k =>
        k.kotId === kotId ? { ...k, priority: 'urgent' } : k
      ));
    } catch (error) {
      console.error('Error marking KOT as urgent:', error);
    }
  };

  const handleCancelKOT = (kotId) => {
    try {
      const reason = prompt('Enter cancellation reason:');
      if (reason) {
        kotManager.cancelKOT(kotId, reason);
        loadKOTs();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error cancelling KOT:', error);
    }
  };

  const handleItemStatusChange = (kotId, kotItemId, newStatus) => {
    try {
      kotManager.updateItemStatus(kotId, kotItemId, newStatus);
      setKots(prev => prev.map(k => {
        if (k.kotId === kotId) {
          const updatedItems = k.items.map(item =>
            item.kotItemId === kotItemId ? { ...item, status: newStatus.toLowerCase() } : item
          );
          return { ...k, items: updatedItems, updatedAt: new Date().toISOString() };
        }
        return k;
      }));
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const speakItem = (kot, forceSpeak = false, mode = 'full') => {
    if (!forceSpeak && !notificationSettings.speechAnnouncements) return;

    try {
      let message;

      if (kot.items && Array.isArray(kot.items)) {
        const items = kot.items.map(item => {
          let itemText = `${item.quantity} ${item.name}`;
          if (item.notes) {
            itemText += ` with note: ${item.notes}`;
          }
          return itemText;
        }).join(', ');

        if (mode === 'full') {
          message = `Order ${kot.orderNumber || 'new'}. ${kot.customer?.name || 'Customer'} at ${kot.customer?.table || 'counter'}. Items: ${items}`;
        } else {
          message = items;
        }
      }

      console.log('Speaking:', message);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error in speakItem:', error);
    }
  };

  const hasAllergyAlert = (kot) => {
    const allergyKeywords = ['allergy', 'allergic', 'nuts', 'peanut', 'gluten', 'dairy', 'milk', 'shellfish', 'egg', 'soy'];
    const notes = (kot.notes || '').toLowerCase();
    return allergyKeywords.some(keyword => notes.includes(keyword));
  };

  const getItemCourse = (item) => {
    const category = item.category || 'Main Course';
    if (['Salad', 'Soup'].includes(category)) return category.toLowerCase();
    if (['Main Course', 'Curry', 'Tandoor', 'Grill', 'BBQ', 'Kebab'].includes(category)) return 'main';
    if (['Dessert', 'Pastry', 'Cake'].includes(category)) return 'dessert';
    if (['Beverage'].includes(category)) return 'beverage';
    if (['Bread', 'Appetizer'].includes(category)) return 'appetizer';
    return 'main';
  };

  const getAllDayPrepList = () => {
    const counts = {};
    (kots || []).forEach(kot => {
      if (kot && (kot.status === 'PENDING' || kot.status === 'PREPARING')) {
        (kot.items || []).forEach(item => {
          if (item && (item.status === 'PENDING' || item.status === 'PREPARING')) {
            counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };
  const prepList = getAllDayPrepList();

  useEffect(() => {
    loadKOTs();
    loadStatistics();

    const handleKOTUpdate = () => {
      loadKOTs();
      loadStatistics();
    };

    kotManager.on('kotCreated', handleKOTUpdate);
    kotManager.on('kotItemUpdated', handleKOTUpdate);
    kotManager.on('kotStatusUpdated', handleKOTUpdate);
    kotManager.on('kotPriorityUpdated', handleKOTUpdate);
    kotManager.on('kotCancelled', handleKOTUpdate);

    const refreshInterval = setInterval(() => {
      loadKOTs();
      loadStatistics();
    }, 30000);

    return () => {
      kotManager.off('kotCreated', handleKOTUpdate);
      kotManager.off('kotItemUpdated', handleKOTUpdate);
      kotManager.off('kotStatusUpdated', handleKOTUpdate);
      kotManager.off('kotPriorityUpdated', handleKOTUpdate);
      kotManager.off('kotCancelled', handleKOTUpdate);
      clearInterval(refreshInterval);
    };
  }, [kotManager, selectedStation, selectedStatusFilter, selectedOrderTypeFilter, notificationSettings.speechAnnouncements]);

  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace'
    }}>
      <style>{`
        @keyframes kds-pulse-border {
          0% { border-color: #ff0000; box-shadow: 0 0 5px rgba(255,0,0,0.3); }
          100% { border-color: #ff3333; box-shadow: 0 0 15px rgba(255,0,0,0.7); }
        }
        @keyframes kds-blink-allergy {
          0% { background: #ff0000; color: #ffffff; }
          50% { background: #ffff00; color: #000000; }
          100% { background: #ff0000; color: #ffffff; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        background: '#000000',
        borderBottom: '2px solid #00ff00',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: screenSize === 'small' ? 'flex-start' : 'center',
        flexDirection: screenSize === 'small' ? 'column' : 'row',
        gap: screenSize === 'small' ? '12px' : '0'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#00ff00', fontFamily: '"Courier New", monospace' }}>
            =================================
            KITCHEN DISPLAY SYSTEM v1.0
            =================================
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#00ff00', fontSize: '12px', fontFamily: '"Courier New", monospace' }}>
            &gt; Real-time order management
          </p>
        </div>
        
        {/* Statistics */}
        {statistics && (
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: screenSize === 'small' ? '8px 12px' : '10px 16px', background: '#000000', border: '1px solid #00ff00', borderRadius: '0px', minWidth: screenSize === 'small' ? '50px' : '60px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: 'bold', color: '#00ff00', fontFamily: '"Courier New", monospace' }}>
                {statistics.active}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: '#00ff00', marginTop: '2px', fontFamily: '"Courier New", monospace' }}>ACTIVE</div>
            </div>
            <div style={{ textAlign: 'center', padding: screenSize === 'small' ? '8px 12px' : '10px 16px', background: '#000000', border: '1px solid #ffff00', borderRadius: '0px', minWidth: screenSize === 'small' ? '50px' : '60px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: 'bold', color: '#ffff00', fontFamily: '"Courier New", monospace' }}>
                {statistics.byStatus.pending}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: '#ffff00', marginTop: '2px', fontFamily: '"Courier New", monospace' }}>PENDING</div>
            </div>
            <div style={{ textAlign: 'center', padding: screenSize === 'small' ? '8px 12px' : '10px 16px', background: '#000000', border: '1px solid #ff0000', borderRadius: '0px', minWidth: screenSize === 'small' ? '50px' : '60px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: 'bold', color: '#ff0000', fontFamily: '"Courier New", monospace' }}>
                {statistics.overdue}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: '#ff0000', marginTop: '2px', fontFamily: '"Courier New", monospace' }}>OVERDUE</div>
            </div>
          </div>
        )}
      </div>

        {/* Controls */}
        <div style={{
          padding: screenSize === 'small' ? '16px' : screenSize === 'medium' ? '16px 20px' : '20px 24px',
          background: '#000000',
          borderBottom: '1px solid #00ff00',
          display: 'flex',
          gap: screenSize === 'small' ? '12px' : screenSize === 'medium' ? '16px' : '24px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          justifyContent: screenSize === 'small' ? 'flex-start' : 'flex-start',
          flexDirection: screenSize === 'small' ? 'column' : 'row'
        }}>
          {/* Station Filter */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '10px' : '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>STATION:</span>
            <button
              onClick={() => setSelectedStation('all')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStation === 'all' ? '#00ff00' : '#000000',
                color: selectedStation === 'all' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedStation(KitchenStation.HOT)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStation === KitchenStation.HOT ? '#00ff00' : '#000000',
                color: selectedStation === KitchenStation.HOT ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              HOT
            </button>
            <button
              onClick={() => setSelectedStation(KitchenStation.COLD)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStation === KitchenStation.COLD ? '#00ff00' : '#000000',
                color: selectedStation === KitchenStation.COLD ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              COLD
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '10px' : '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>STATUS:</span>
            <button
              onClick={() => setSelectedStatusFilter('all')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStatusFilter === 'all' ? '#00ff00' : '#000000',
                color: selectedStatusFilter === 'all' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.PENDING)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStatusFilter === KOTStatus.PENDING ? '#ffff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.PENDING ? '#000000' : '#ffff00',
                border: '1px solid #ffff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              PENDING
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.PREPARING)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStatusFilter === KOTStatus.PREPARING ? '#00ff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.PREPARING ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              PREPARING
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.READY)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedStatusFilter === KOTStatus.READY ? '#00ff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.READY ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              READY
            </button>
          </div>
 
          {/* Order Type Filter */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '10px' : '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>ORDER TYPE:</span>
            <button
              onClick={() => setSelectedOrderTypeFilter('all')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: selectedOrderTypeFilter === 'all' ? '#00ff00' : '#000000',
                color: selectedOrderTypeFilter === 'all' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedOrderTypeFilter('qr')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '80px' : '90px',
                background: selectedOrderTypeFilter === 'qr' ? '#00ff00' : '#000000',
                color: selectedOrderTypeFilter === 'qr' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              QR ORDER
            </button>
            <button
              onClick={() => setSelectedOrderTypeFilter('dine-in')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '80px' : '90px',
                background: selectedOrderTypeFilter === 'dine-in' ? '#00ff00' : '#000000',
                color: selectedOrderTypeFilter === 'dine-in' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              DINE IN
            </button>
            <button
              onClick={() => setSelectedOrderTypeFilter('takeaway')}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '80px' : '90px',
                background: selectedOrderTypeFilter === 'takeaway' ? '#00ff00' : '#000000',
                color: selectedOrderTypeFilter === 'takeaway' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              TAKEAWAY
            </button>
          </div>


          {/* Speech Toggle */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '10px' : '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>SPEECH:</span>
            <button
              onClick={() => {
                const updated = { ...settings, notifications: { ...notificationSettings, speechAnnouncements: !notificationSettings.speechAnnouncements } };
                onSettingsChange?.(updated);
              }}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '60px' : '70px',
                background: notificationSettings.speechAnnouncements ? '#00ff00' : '#000000',
                color: notificationSettings.speechAnnouncements ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {notificationSettings.speechAnnouncements ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Printer Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowPrinterSelect(!showPrinterSelect); setShowQuickSettings(false); }}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '120px' : '140px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              🖨 [ PRINTER ]
              <span style={{ fontSize: '9px', padding: '2px 6px', background: printers.find(p => p.id === selectedPrinter)?.status === 'online' ? '#00ff00' : '#ff0000', color: '#000000', fontWeight: 'bold' }}>
                {printers.find(p => p.id === selectedPrinter)?.status?.toUpperCase() || 'N/A'}
              </span>
            </button>

            {showPrinterSelect && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: screenSize === 'small' || screenSize === 'medium' ? 'auto' : '0',
                left: screenSize === 'small' || screenSize === 'medium' ? '0' : 'auto',
                marginTop: '4px',
                background: '#000000',
                border: '2px solid #00ff00',
                minWidth: screenSize === 'small' ? '220px' : '260px',
                maxWidth: screenSize === 'small' ? '90vw' : 'none',
                zIndex: 1001,
                fontFamily: '"Courier New", monospace'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #00ff00', fontSize: '12px', fontWeight: 'bold', color: '#00ff00' }}>
                  &gt; SELECT PRINTER
                </div>
                {printers.map(printer => (
                  <div
                    key={printer.id}
                    onClick={() => { setSelectedPrinter(printer.id); setShowPrinterSelect(false); }}
                    style={{
                      padding: '14px 16px',
                      minHeight: '48px',
                      cursor: printer.status === 'online' ? 'pointer' : 'not-allowed',
                      background: selectedPrinter === printer.id ? '#00ff00' : '#000000',
                      color: selectedPrinter === printer.id ? '#000000' : printer.status === 'online' ? '#00ff00' : '#222222444',
                      borderBottom: '1px dashed #00ff00',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      transition: 'background 0.15s',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={e => { if (selectedPrinter !== printer.id && printer.status === 'online') e.currentTarget.style.background = '#111111'; }}
                    onMouseLeave={e => { if (selectedPrinter !== printer.id) e.currentTarget.style.background = '#000000'; }}
                  >
                    <span style={{ fontWeight: 'bold' }}>{printer.name}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      background: printer.status === 'online' ? (selectedPrinter === printer.id ? '#000000' : '#00ff00') : '#ff0000',
                      color: printer.status === 'online' ? (selectedPrinter === printer.id ? '#00ff00' : '#000000') : '#ffffff',
                      fontWeight: 'bold'
                    }}>
                      {printer.status === 'online' ? (selectedPrinter === printer.id ? '✓ ACTIVE' : 'ONLINE') : 'OFFLINE'}
                    </span>
                  </div>
                ))}
                <div style={{ padding: '12px 16px', fontSize: '11px', color: '#222222444', borderTop: '1px solid #222222' }}>
                  {printers.filter(p => p.status === 'online').length}/{printers.length} printers online
                </div>
              </div>
            )}
          </div>

          {/* Quick Settings Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                minHeight: '44px',
                minWidth: screenSize === 'small' ? '100px' : '120px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              [ SETTINGS ]
            </button>

            {/* Quick Settings Dropdown */}
            {showQuickSettings && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: screenSize === 'small' || screenSize === 'medium' ? 'auto' : '0',
                left: screenSize === 'small' || screenSize === 'medium' ? '0' : 'auto',
                marginTop: '4px',
                background: '#000000',
                border: '1px solid #00ff00',
                padding: '12px',
                minWidth: screenSize === 'small' ? '240px' : '280px',
                maxWidth: screenSize === 'small' ? '90vw' : 'none',
                zIndex: 1000,
                fontFamily: '"Courier New", monospace'
              }}>
                <div style={{ marginBottom: '12px', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>DISPLAY</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Ticket Zoom:</span>
                    <select
                      value={displaySettings.ticketZoom || 100}
                      onChange={(e) => {
                        const updated = { ...settings, display: { ...displaySettings, ticketZoom: parseInt(e.target.value) } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      <option value="75">75%</option>
                      <option value="100">100%</option>
                      <option value="125">125%</option>
                      <option value="150">150%</option>
                      <option value="175">175%</option>
                      <option value="200">200%</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Layout:</span>
                    <select
                      value={displaySettings.ticketLayout || 'grid'}
                      onChange={(e) => {
                        const updated = { ...settings, display: { ...displaySettings, ticketLayout: e.target.value } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Sort By:</span>
                    <select
                      value={displaySettings.sortOrder || 'time'}
                      onChange={(e) => {
                        const updated = { ...settings, display: { ...displaySettings, sortOrder: e.target.value } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      <option value="time">Time</option>
                      <option value="priority">Priority</option>
                      <option value="station">Station</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>ORDERS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Course Separation:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, orderManagement: { ...orderManagementSettings, courseBasedSeparation: !orderManagementSettings.courseBasedSeparation } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: orderManagementSettings.courseBasedSeparation ? '#00ff00' : '#000000',
                        color: orderManagementSettings.courseBasedSeparation ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {orderManagementSettings.courseBasedSeparation ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>STATIONS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Item Routing:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, stations: { ...stationSettings, itemLevelRouting: !stationSettings.itemLevelRouting } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: stationSettings.itemLevelRouting ? '#00ff00' : '#000000',
                        color: stationSettings.itemLevelRouting ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {stationSettings.itemLevelRouting ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Load Balancing:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, stations: { ...stationSettings, loadBalancing: !stationSettings.loadBalancing } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: stationSettings.loadBalancing ? '#00ff00' : '#000000',
                        color: stationSettings.loadBalancing ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {stationSettings.loadBalancing ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Assembly Lines:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, stations: { ...stationSettings, assemblyLines: !stationSettings.assemblyLines } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: stationSettings.assemblyLines ? '#00ff00' : '#000000',
                        color: stationSettings.assemblyLines ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {stationSettings.assemblyLines ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>PERFORMANCE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Bottleneck Detect:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, performance: { ...performanceSettings, bottleneckDetection: !performanceSettings.bottleneckDetection } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: performanceSettings.bottleneckDetection ? '#00ff00' : '#000000',
                        color: performanceSettings.bottleneckDetection ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {performanceSettings.bottleneckDetection ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Performance Metrics:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, performance: { ...performanceSettings, performanceMetrics: !performanceSettings.performanceMetrics } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: performanceSettings.performanceMetrics ? '#00ff00' : '#000000',
                        color: performanceSettings.performanceMetrics ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {performanceSettings.performanceMetrics ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>All Day Counts:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, performance: { ...performanceSettings, allDayCounts: !performanceSettings.allDayCounts } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: performanceSettings.allDayCounts ? '#00ff00' : '#000000',
                        color: performanceSettings.allDayCounts ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {performanceSettings.allDayCounts ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>ADVANCED</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Offline Mode:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, advanced: { ...advancedSettings, offlineMode: !advancedSettings.offlineMode } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: advancedSettings.offlineMode ? '#00ff00' : '#000000',
                        color: advancedSettings.offlineMode ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {advancedSettings.offlineMode ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>View Recipes:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, advanced: { ...advancedSettings, viewingRecipes: !advancedSettings.viewingRecipes } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: advancedSettings.viewingRecipes ? '#00ff00' : '#000000',
                        color: advancedSettings.viewingRecipes ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {advancedSettings.viewingRecipes ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Auto Refresh:</span>
                    <button
                      onClick={() => {
                        const updated = { ...settings, advanced: { ...advancedSettings, autoRefresh: !advancedSettings.autoRefresh } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: advancedSettings.autoRefresh ? '#00ff00' : '#000000',
                        color: advancedSettings.autoRefresh ? '#000000' : '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      {advancedSettings.autoRefresh ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#00ff00' }}>Interval:</span>
                    <select
                      value={advancedSettings.refreshInterval || 5}
                      onChange={(e) => {
                        const updated = { ...settings, advanced: { ...advancedSettings, refreshInterval: parseInt(e.target.value) } };
                        onSettingsChange?.(updated);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '0px',
                        fontSize: '10px',
                        fontFamily: '"Courier New", monospace'
                      }}
                    >
                      <option value="3">3s</option>
                      <option value="5">5s</option>
                      <option value="10">10s</option>
                      <option value="30">30s</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* All-Day Prep Panel */}
      {prepList.length > 0 && (
        <div style={{
          background: '#000000',
          borderBottom: '2px solid #00ff00',
          padding: '8px 24px',
          fontFamily: '"Courier New", monospace'
        }}>
          <div 
            onClick={() => setShowAllDayPrep(!showAllDayPrep)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            <span>
              &gt; ALL-DAY BATCH PREP LIST ({prepList.length} items pending)
            </span>
            <span style={{ color: '#00ff00' }}>
              {showAllDayPrep ? '[-] HIDE PREP MATRIX' : '[+] SHOW PREP MATRIX'}
            </span>
          </div>
          {showAllDayPrep && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              border: '1px solid #00ff00',
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px',
              background: '#000000'
            }}>
              {prepList.map(([name, count]) => (
                <div 
                  key={name} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '4px 8px',
                    background: '#111111',
                    border: '1px dashed #00ff00'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{name}</span>
                  <span style={{ background: '#00ff00', color: '#000000', padding: '0 6px', fontWeight: 'bold' }}>
                    x{count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KOT Grid */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '24px',
        background: '#000000',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div style={{
          display: displaySettings.ticketLayout === 'list' ? 'flex' : 'grid',
          flexDirection: displaySettings.ticketLayout === 'list' ? 'column' : undefined,
          gridTemplateColumns: displaySettings.ticketLayout === 'compact' 
            ? screenSize === 'small' ? 'repeat(auto-fill, minmax(180px, 1fr))' 
            : screenSize === 'medium' ? 'repeat(auto-fill, minmax(220px, 1fr))' 
            : 'repeat(auto-fill, minmax(280px, 1fr))'
            : screenSize === 'small' ? '1fr' 
            : screenSize === 'medium' ? 'repeat(auto-fill, minmax(250px, 1fr))' 
            : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: displaySettings.ticketLayout === 'compact' 
            ? '8px' 
            : screenSize === 'small' ? '8px' 
            : screenSize === 'medium' ? '12px' 
            : '16px'
        }}>
          {kots.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: '#00ff00',
              fontSize: '14px',
              fontFamily: '"Courier New", monospace'
            }}>
              =================================
              NO ORDERS FOUND
              =================================
            </div>
          ) : (
            kots.map(kot => (
              <KOTCard
                key={kot.kotId}
                kot={kot}
                screenSize={screenSize}
                onItemStatusChange={handleItemStatusChange}
                onKOTStatusChange={handleKOTStatusChange}
                onMarkUrgent={handleMarkUrgent}
                onCancelKOT={handleCancelKOT}
                onSpeakItem={speakItem}
                hasAllergyAlert={hasAllergyAlert}
                getItemCourse={getItemCourse}
                displaySettings={displaySettings}
                menuItems={menuItems}
                advancedSettings={advancedSettings}
                onViewRecipe={setSelectedRecipe}
              />
            ))
          )}
        </div>
      </div>

      {/* Recipe Panel Modal */}
      {selectedRecipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#000000',
            border: '2px solid #00ff00',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            color: '#00ff00',
            fontFamily: '"Courier New", monospace',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #00ff00', paddingBottom: '10px', marginBottom: '16px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>&gt; RECIPE: {selectedRecipe.name.toUpperCase()}</span>
              <button 
                onClick={() => setSelectedRecipe(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff0000',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                [X]
              </button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {selectedRecipe.recipe || 'No detailed recipe steps specified for this item.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  padding: '6px 16px',
                  background: '#00ff00',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                CLOSE [ESC]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// KOT Card Component
function KOTCard({ kot, screenSize, onItemStatusChange, onKOTStatusChange, onMarkUrgent, onCancelKOT, onSpeakItem, hasAllergyAlert, getItemCourse, displaySettings, menuItems, advancedSettings, onViewRecipe }) {
  const [expanded, setExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const timeElapsed = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000);
  const orderAge = kot.orderAge || timeElapsed;
  const isOverdue = kot.estimatedReadyAt ? new Date() > new Date(kot.estimatedReadyAt) && kot.status !== KOTStatus.SERVED : false;
  const hasAllergy = hasAllergyAlert ? hasAllergyAlert(kot) : false;

  const totalCount = kot.items?.length || 0;
  const readyCount = kot.items?.filter(item => (item.status || 'pending').toLowerCase() === 'ready').length || 0;
  const percentage = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const formatTimestamp = (date) => {
    if (!date) return '--:--';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        const readyTime = new Date(kot.estimatedReadyAt);
        const diff = Math.floor((readyTime - now) / 1000);
        setTimeLeft(Math.max(0, diff));
      } catch (error) {
        console.error('Error calculating time left:', error);
        setTimeLeft(0);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 5000);

    return () => clearInterval(interval);
  }, [kot.estimatedReadyAt]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '0px',
      border: isOverdue ? '3px solid #ff0000' : '2px solid #000000',
      overflow: 'hidden',
      boxShadow: isOverdue ? '0 0 12px rgba(255, 0, 0, 0.7)' : '2px 2px 0px rgba(0, 0, 0, 0.1)',
      animation: isOverdue ? 'kds-pulse-border 1.5s infinite alternate' : 'none',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: '"Courier New", monospace',
      transform: `scale(${(displaySettings.ticketZoom || 100) / 100})`,
      transformOrigin: 'top left'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = isOverdue ? '0 0 16px rgba(255, 0, 0, 0.9)' : '4px 4px 0px rgba(0, 0, 0, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = isOverdue ? '0 0 12px rgba(255, 0, 0, 0.7)' : '2px 2px 0px rgba(0, 0, 0, 0.1)';
    }}
    >
      {hasAllergy && (
        <div style={{
          animation: 'kds-blink-allergy 1s infinite',
          padding: '5px 10px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: '900',
          letterSpacing: '1px',
          borderBottom: '2px solid #000000',
          fontFamily: '"Courier New", monospace'
        }}>
          ⚠️ ALLERGY ALERT / CUSTOM DETAILS ⚠️
        </div>
      )}
      {/* Card Header */}
      <div style={{
        padding: screenSize === 'small' ? '12px' : '16px',
        background: '#ffffff',
        borderBottom: '2px dashed #000000',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: screenSize === 'small' ? '8px' : '12px', gap: screenSize === 'small' ? '8px' : '12px' }}>
          {/* Left side - Order info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '6px' : '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <span style={{ 
              fontSize: screenSize === 'small' ? '14px' : '18px', 
              fontWeight: 'bold', 
              color: '#000000',
              fontFamily: '"Courier New", monospace'
            }}>#{kot.orderNumber}</span>
            {kot.token && (
              <span style={{
                padding: screenSize === 'small' ? '2px 6px' : '4px 8px',
                background: '#000000',
                color: '#ffffff',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '9px' : '10px',
                fontWeight: 'bold',
                border: '1px solid #000000',
                fontFamily: '"Courier New", monospace',
                flexShrink: 0
              }}>
                {kot.token}
              </span>
            )}
            {kot.station && (
              <span style={{
                padding: screenSize === 'small' ? '2px 6px' : '4px 8px',
                background: '#000000',
                color: '#ffffff',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '9px' : '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid #000000',
                fontFamily: '"Courier New", monospace',
                flexShrink: 0
              }}>
                {kot.station}
              </span>
            )}
          </div>

          {/* Right side - Status Badge */}
          <div style={{
            padding: screenSize === 'small' ? '4px 8px' : '6px 12px',
            background: isOverdue ? '#ff0000' : kot.status === KOTStatus.READY ? '#00ff00' : kot.status === KOTStatus.PREPARING ? '#0000ff' : kot.status === KOTStatus.PENDING ? '#ffaa00' : '#808080',
            color: kot.status === KOTStatus.PENDING ? '#000000' : '#ffffff',
            borderRadius: '0px',
            fontSize: screenSize === 'small' ? '10px' : '12px',
            fontWeight: '900',
            textTransform: 'uppercase',
            border: '2px solid #000000',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: '1.2',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
            flexShrink: 0,
            minWidth: screenSize === 'small' ? '60px' : '80px'
          }}>
            <div>{kot.status}</div>
            <div style={{ fontSize: screenSize === 'small' ? '8px' : '9px', marginTop: '2px', borderTop: '1px solid currentColor', width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>
              {percentage}%
            </div>
          </div>
        </div>

        {/* Second row - Countdown and meta info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '12px', flexWrap: 'wrap' }}>
          {/* Countdown Timer */}
          <div style={{
            padding: screenSize === 'small' ? '3px 6px' : '4px 8px',
            background: isOverdue ? '#ff0000' : timeLeft < 300 ? '#ffff00' : '#00ff00',
            color: '#000000',
            borderRadius: '0px',
            fontSize: screenSize === 'small' ? '10px' : '11px',
            fontWeight: 'bold',
            fontFamily: '"Courier New", monospace',
            border: '1px solid #000000',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {isOverdue ? 'OVERDUE' : formatTime(timeLeft)}
          </div>

          {/* Order Meta Info */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', fontSize: screenSize === 'small' ? '9px' : '10px', color: '#000000', flexWrap: 'wrap', fontFamily: '"Courier New", monospace', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>{kot.customer?.name || 'Walk-in'}</span>
            </div>
            {kot.customer?.table && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span>•</span>
                <span>T{kot.customer.table}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>•</span>
              <span style={{ fontWeight: 'bold' }}>{orderAge}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: screenSize === 'small' ? '20px' : '28px', background: '#ffffff' }}>
          {/* Items List */}
          <div style={{ marginBottom: screenSize === 'small' ? '20px' : '24px' }}>
            <div style={{
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: screenSize === 'small' ? '12px' : '16px',
              fontFamily: '"Courier New", monospace',
              borderBottom: '1px solid #000000',
              paddingBottom: '10px'
            }}>
              ORDER ITEMS ({kot.items?.length || 0})
            </div>
            {kot.items?.map((item, index) => (
              <div key={item.kotItemId || index} style={{
                padding: '12px 0',
                borderBottom: '1px dashed #000000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: '"Courier New", monospace'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                      {item.quantity}x {item.name}
                    </div>
                    {advancedSettings.viewingRecipes && (
                      <button
                        onClick={() => {
                          const recipe = menuItems?.find(m => m.id === item.menuItemId);
                          if (recipe) {
                            onViewRecipe(recipe);
                          } else {
                            onViewRecipe({ name: item.name, recipe: 'No detailed recipe steps specified for this item.' });
                          }
                        }}
                        style={{
                          padding: '2px 6px',
                          background: '#000000',
                          color: '#00ff00',
                          border: '1px solid #00ff00',
                          borderRadius: '0px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: '"Courier New", monospace'
                        }}
                      >
                        RECIPE
                      </button>
                    )}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '11px', color: '#ff0000', marginTop: '4px', fontWeight: 'bold' }}>
                      Note: {item.notes}
                    </div>
                  )}
                  {item.modifications && item.modifications.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#666666', marginTop: '4px' }}>
                      {item.modifications.map(mod => (
                        <span key={mod} style={{ marginRight: '8px' }}>• {mod}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const current = (item.status || 'pending').toLowerCase();
                    const next = current === 'pending' ? 'preparing' : current === 'preparing' ? 'ready' : 'pending';
                    onItemStatusChange(kot.kotId, item.kotItemId, next);
                  }}
                  title="Click to cycle status: Pending -> Preparing -> Ready"
                  style={{
                    padding: '8px 14px',
                    background: (item.status || 'pending').toLowerCase() === 'ready' ? '#00ff00' : (item.status || 'pending').toLowerCase() === 'preparing' ? '#ffff00' : '#808080',
                    color: '#000000',
                    border: '1px solid #000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderRadius: '0px',
                    cursor: 'pointer',
                    fontFamily: '"Courier New", monospace',
                    outline: 'none',
                    minHeight: '36px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {(item.status || 'pending').toUpperCase()}
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          {kot.notes && (
            <div style={{
              padding: '12px',
              background: '#ffff00',
              border: '2px solid #000000',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#000000',
              fontFamily: '"Courier New", monospace'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>NOTES:</div>
              <div>{kot.notes}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSpeakItem && onSpeakItem(kot, true, 'full')}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ SPEAK FULL ]
            </button>
            <button
              onClick={() => onSpeakItem && onSpeakItem(kot, true, 'items')}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ SPEAK ITEMS ]
            </button>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.PREPARING)}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ START ]
            </button>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.READY)}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#00ff00',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ READY ]
            </button>
            <button
              onClick={() => onMarkUrgent(kot.kotId)}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#ff0000',
                color: '#ffffff',
                border: '1px solid #000000',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ URGENT ]
            </button>
            <button
              onClick={() => onCancelKOT(kot.kotId)}
              style={{
                padding: screenSize === 'small' ? '12px 16px' : '14px 20px',
                background: '#000000',
                color: '#ff0000',
                border: '1px solid #ff0000',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                minHeight: screenSize === 'small' ? '50px' : '60px',
                flex: screenSize === 'small' ? '1 1 auto' : 'none'
              }}
            >
              [ CANCEL ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
