import React, { useState, useEffect } from 'react';

export default function SplitKDS({ orders = [], setOrders, splitSettings, onSplitSettingsChange }) {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState('kds');
  const [viewMode, setViewMode] = useState('dynamic');
  const [showAllDay, setShowAllDay] = useState(false);
  const [showRecentlyFulfilled, setShowRecentlyFulfilled] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [ticketScrollPosition, setTicketScrollPosition] = useState(0);
  const [allDayViewMode, setAllDayViewMode] = useState('item_only'); // 'item_only' or 'item_modifiers'
  const [recentlyFulfilledTimeframe, setRecentlyFulfilledTimeframe] = useState(30); // minutes
  const [recallCount, setRecallCount] = useState(0);
  const [fulfillmentTimers, setFulfillmentTimers] = useState({});
  const [doubleTapEnabled, setDoubleTapEnabled] = useState(true);
  const [lastTapTime, setLastTapTime] = useState({});
  const [unfulfillMode, setUnfulfillMode] = useState(false);
  const [selectedForUnfulfill, setSelectedForUnfulfill] = useState([]);

  // Dining Options Support
  const [selectedDiningOptions, setSelectedDiningOptions] = useState(['dine_in', 'takeout', 'delivery', 'curbside', 'online']);
  const [diningOptionColors, setDiningOptionColors] = useState({
    dine_in: '#4a90e2',
    takeout: '#f39c12',
    delivery: '#e74c3c',
    curbside: '#9b59b6',
    online: '#27ae60'
  });

  // Prep Station Configuration
  const [prepStations, setPrepStations] = useState([
    { id: 'hot', name: 'Hot Station', color: '#e74c3c' },
    { id: 'cold', name: 'Cold Station', color: '#3498db' },
    { id: 'grill', name: 'Grill Station', color: '#f39c12' },
    { id: 'fry', name: 'Fry Station', color: '#9b59b6' },
    { id: 'dessert', name: 'Dessert Station', color: '#e91e63' }
  ]);
  const [selectedPrepStations, setSelectedPrepStations] = useState(['hot', 'cold', 'grill', 'fry', 'dessert']);
  const [isExpediter, setIsExpediter] = useState(false);

  // Assembly Line
  const [assemblyLineEnabled, setAssemblyLineEnabled] = useState(false);
  const [assemblySequence, setAssemblySequence] = useState(['hot', 'cold', 'grill']);

  // Performance Reporting
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageFulfillmentTime: 0,
    ticketsPerHour: 0,
    itemsPerTicket: 0,
    errorRate: 0,
    onTimeRate: 0
  });

  // Correction Process
  const [correctionMode, setCorrectionMode] = useState(false);
  const [selectedForCorrection, setSelectedForCorrection] = useState(null);

  // Customizable Layout
  const [ticketLayout, setTicketLayout] = useState({
    showCourse: true,
    showModifiers: true,
    showTableNumber: true,
    showCustomerName: true,
    showElapsedTime: true,
    showItemCount: true,
    modifierDisplay: 'vertical', // 'vertical' or 'horizontal'
    consolidateItems: true
  });

  // Load Balancing
  const [loadBalancingEnabled, setLoadBalancingEnabled] = useState(false);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOverflowMenu && !event.target.closest('[data-overflow-menu]')) {
        setShowOverflowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOverflowMenu]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Group orders by cache/number for column layout (stable grouping)
  const groupedOrders = orders.reduce((groups, order) => {
    const cacheNumber = (order.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10) + 1;
    if (!groups[cacheNumber]) {
      groups[cacheNumber] = [];
    }
    groups[cacheNumber].push(order);
    return groups;
  }, {});

  // All Day View - Group items by name and count totals
  const getAllDayViewData = () => {
    const firedOrders = getOrdersByDiningOptions().filter(o => o.status === 'PREPARING' || o.status === 'PENDING');
    const itemGroups = {};

    firedOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.name;
        if (!itemGroups[itemName]) {
          itemGroups[itemName] = {
            total: 0,
            modifiers: {},
            regular: 0
          };
        }
        itemGroups[itemName].total += item.quantity;

        if (item.modifiers && item.modifiers.length > 0) {
          const modifierKey = item.modifiers.sort().join(', ');
          if (!itemGroups[itemName].modifiers[modifierKey]) {
            itemGroups[itemName].modifiers[modifierKey] = 0;
          }
          itemGroups[itemName].modifiers[modifierKey] += item.quantity;
        } else {
          itemGroups[itemName].regular += item.quantity;
        }
      });
    });

    return itemGroups;
  };

  // Recently Fulfilled - Get orders completed within timeframe
  const getRecentlyFulfilledOrders = () => {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - recentlyFulfilledTimeframe * 60000);

    return getOrdersByDiningOptions().filter(o => {
      if (o.status !== 'COMPLETED') return false;
      const completedAt = o.completedAt ? new Date(o.completedAt) : null;
      return completedAt && completedAt >= cutoffTime;
    });
  };

  // Recall - Get most recent fulfilled order to bring back
  const getRecallOrder = () => {
    const recentlyFulfilled = getRecentlyFulfilledOrders();
    if (recentlyFulfilled.length === 0) return null;

    // Sort by completedAt descending to get most recent
    const sorted = [...recentlyFulfilled].sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });

    // Return the order at the recallCount index (for multiple recalls)
    return sorted[recallCount] || sorted[0];
  };

  // Handle recall action
  const handleRecall = () => {
    const orderToRecall = getRecallOrder();
    if (!orderToRecall) {
      alert('No recently fulfilled tickets to recall within the timeframe.');
      return;
    }

    const updatedOrders = orders.map(o => {
      if (o.id === orderToRecall.id) {
        return {
          ...o,
          status: 'PREPARING',
          recalledAt: new Date().toISOString(),
          completedAt: null,
          isRecalled: true
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    setRecallCount(recallCount + 1);
  };

  // Handle unfulfill action
  const handleUnfulfill = () => {
    if (selectedForUnfulfill.length === 0) {
      alert('Select tickets to unfulfill first.');
      return;
    }

    const updatedOrders = orders.map(o => {
      if (selectedForUnfulfill.includes(o.id)) {
        return {
          ...o,
          status: 'PREPARING',
          completedAt: null,
          isRecalled: true
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    setSelectedForUnfulfill([]);
    setUnfulfillMode(false);
    setShowRecentlyFulfilled(false);
  };

  // By Table - Group orders by table number
  const getByTableData = () => {
    const tableGroups = {};
    getOrdersByDiningOptions().filter(o => o.status === 'PENDING' || o.status === 'PREPARING').forEach(order => {
      const tableNum = order.tableNumber || 'Walk-in';
      if (!tableGroups[tableNum]) {
        tableGroups[tableNum] = [];
      }
      tableGroups[tableNum].push(order);
    });
    return tableGroups;
  };

  // By Product - Group orders by items/products
  const getByProductData = () => {
    const productGroups = {};
    getOrdersByDiningOptions().filter(o => o.status === 'PENDING' || o.status === 'PREPARING').forEach(order => {
      order.items?.forEach(item => {
        const productName = item.name;
        if (!productGroups[productName]) {
          productGroups[productName] = [];
        }
        productGroups[productName].push({ order, item });
      });
    });
    return productGroups;
  };

  // Waiting - Orders not yet fired (sent to kitchen)
  const getWaitingOrders = () => {
    return getOrdersByDiningOptions().filter(o => o.status === 'SENT' || o.status === 'SCHEDULED');
  };

  // Overview - Summary statistics
  const getOverviewData = () => {
    const filteredOrders = getOrdersByDiningOptions();
    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'PENDING').length,
      preparing: filteredOrders.filter(o => o.status === 'PREPARING').length,
      completed: filteredOrders.filter(o => o.status === 'COMPLETED').length,
      cancelled: filteredOrders.filter(o => o.status === 'CANCELLED').length,
      sent: filteredOrders.filter(o => o.status === 'SENT').length
    };
  };

  // Handle double-tap for fulfillment
  const handleTicketTap = (orderId, e) => {
    if (!doubleTapEnabled) {
      handleOrderClick(orderId);
      return;
    }

    const now = Date.now();
    const lastTap = lastTapTime[orderId] || 0;

    if (now - lastTap < 300) { // Double tap detected (300ms threshold)
      // Fulfill the order
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, status: 'COMPLETED', completedAt: new Date().toISOString() };
        }
        return o;
      });
      setOrders(updatedOrders);
      setLastTapTime({ ...lastTapTime, [orderId]: 0 });
    } else {
      // Single tap - select the order
      handleOrderClick(orderId);
      setLastTapTime({ ...lastTapTime, [orderId]: now });
    }
  };

  // Fulfillment timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      orders.filter(o => o.status === 'PREPARING' || o.status === 'PENDING').forEach(order => {
        if (order.createdAt) {
          const startTime = new Date(order.createdAt).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          newTimers[order.id] = elapsed;
        }
      });
      setFulfillmentTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  // Performance Metrics Calculation
  useEffect(() => {
    const completedOrders = orders.filter(o => o.status === 'COMPLETED' && o.completedAt);
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        if (order.createdAt && order.completedAt) {
          return sum + (new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime());
        }
        return sum;
      }, 0);

      const avgTime = totalTime / completedOrders.length / 1000; // seconds
      const oneHourAgo = new Date(Date.now() - 3600000);
      const recentOrders = completedOrders.filter(o => o.completedAt && new Date(o.completedAt) >= oneHourAgo);
      const ticketsPerHour = recentOrders.length;

      const totalItems = completedOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
      const itemsPerTicket = totalItems / completedOrders.length;

      const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
      const errorRate = (cancelledOrders.length / orders.length) * 100;

      const onTimeOrders = completedOrders.filter(o => {
        if (o.createdAt && o.completedAt) {
          const time = (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 1000;
          return time <= 900; // 15 minutes threshold
        }
        return false;
      });
      const onTimeRate = (onTimeOrders.length / completedOrders.length) * 100;

      setPerformanceMetrics({
        averageFulfillmentTime: Math.round(avgTime),
        ticketsPerHour,
        itemsPerTicket: Math.round(itemsPerTicket * 10) / 10,
        errorRate: Math.round(errorRate * 10) / 10,
        onTimeRate: Math.round(onTimeRate * 10) / 10
      });
    }
  }, [orders]);

  // Dining Options Filter
  const getOrdersByDiningOptions = () => {
    return orders.filter(order => {
      const diningOption = order.diningOption || 'dine_in';
      return selectedDiningOptions.includes(diningOption);
    });
  };

  // Prep Station Routing
  const getOrdersForPrepStation = (stationId) => {
    const stationOrders = [];
    getOrdersByDiningOptions().filter(o => o.status === 'PENDING' || o.status === 'PREPARING').forEach(order => {
      order.items?.forEach(item => {
        const itemStation = item.prepStation || 'hot';
        if (itemStation === stationId || (isExpediter && selectedPrepStations.includes(itemStation))) {
          stationOrders.push({ order, item });
        }
      });
    });
    return stationOrders;
  };

  // Assembly Line Processing
  const processAssemblyLine = (order) => {
    if (!assemblyLineEnabled) return order;

    const processedItems = [];
    assemblySequence.forEach((stationId, index) => {
      const stationItems = order.items?.filter(item => {
        const itemStation = item.prepStation || 'hot';
        return itemStation === stationId;
      }) || [];

      if (stationItems.length > 0) {
        processedItems.push({
          station: prepStations.find(s => s.id === stationId)?.name || stationId,
          items: stationItems,
          sequence: index + 1
        });
      }
    });

    return { ...order, assemblyLineItems: processedItems };
  };

  // Runner Fulfillment
  const handleRunnerFulfillment = (orderId) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'RUNNER_ASSIGNED',
          runnerAssignedAt: new Date().toISOString()
        };
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  // Correction Process
  const handleCorrection = (orderId, correctionType, correctionData) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          corrections: [...(o.corrections || []), {
            type: correctionType,
            data: correctionData,
            timestamp: new Date().toISOString()
          }],
          status: 'CORRECTION_PENDING'
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    setCorrectionMode(false);
    setSelectedForCorrection(null);
  };

  // Load Balancing
  const balanceLoadAcrossStations = () => {
    if (!loadBalancingEnabled) return [];

    const stationLoads = {};
    selectedPrepStations.forEach(stationId => {
      stationLoads[stationId] = getOrdersForPrepStation(stationId).length;
    });

    return Object.entries(stationLoads).sort((a, b) => a[1] - b[1]);
  };

  // Get dining option color
  const getDiningOptionColor = (diningOption) => {
    return diningOptionColors[diningOption] || '#4a90e2';
  };

  // Get dining option label
  const getDiningOptionLabel = (diningOption) => {
    const labels = {
      dine_in: 'Dine-In',
      takeout: 'Takeout',
      delivery: 'Delivery',
      curbside: 'Curbside',
      online: 'Online'
    };
    return labels[diningOption] || diningOption;
  };

  const handleOrderClick = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleScrollToStart = () => {
    const ticketArea = document.querySelector('[data-ticket-area="true"]');
    if (ticketArea) {
      ticketArea.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    setTicketScrollPosition(0);
  };

  const handleScrollToEnd = () => {
    const ticketArea = document.querySelector('[data-ticket-area="true"]');
    if (ticketArea) {
      ticketArea.scrollTo({ top: ticketArea.scrollHeight, left: ticketArea.scrollWidth, behavior: 'smooth' });
    }
    const totalTickets = orders.length;
    setTicketScrollPosition(totalTickets - 1);
  };

  const pendingOrders = getOrdersByDiningOptions().filter(o => o.status === 'PENDING' || o.status === 'PREPARING');
  const completedOrders = getOrdersByDiningOptions().filter(o => o.status === 'COMPLETED');
  const totalTickets = showAllDay ? getOrdersByDiningOptions().length : pendingOrders.length;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      color: '#ffffff'
    }}>
      {/* Toast-style Top Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #404040',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: Back arrow and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => alert('Navigating back to Toast home...')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ←
          </button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            Kitchen Display
          </div>
        </div>

        {/* Right: Options */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowAllDay(!showAllDay)}
            style={{
              padding: '8px 12px',
              background: showAllDay ? '#4a90e2' : '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #4a90e2',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            All Day
          </button>
          <button
            onClick={() => setShowRecentlyFulfilled(!showRecentlyFulfilled)}
            style={{
              padding: '8px 12px',
              background: showRecentlyFulfilled ? '#4a90e2' : '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #4a90e2',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Recently Fulfilled
          </button>
          <button
            onClick={handleRecall}
            style={{
              padding: '8px 12px',
              background: '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #555555',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Recall
          </button>
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            style={{
              padding: '8px 12px',
              background: '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #555555',
              borderRadius: '4px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Overflow Menu */}
      {showOverflowMenu && (
        <div
          data-overflow-menu="true"
          style={{
            position: 'absolute',
            top: '50px',
            right: '16px',
            background: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '6px',
            padding: '8px 0',
            zIndex: 1000,
            minWidth: '280px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
          {/* Close Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            borderBottom: '1px solid #404040'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
              Settings
            </div>
            <button
              onClick={() => setShowOverflowMenu(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888888',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          {/* Layout Settings */}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Layout
          </div>
          <button
            onClick={() => {
              setViewMode(viewMode === 'dynamic' ? 'grid' : 'dynamic');
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Layout</span>
            <span style={{ color: '#888' }}>{viewMode === 'dynamic' ? 'Dynamic' : 'Grid'}</span>
          </button>
          <button
            onClick={() => {
              setAllDayViewMode(allDayViewMode === 'item_only' ? 'item_modifiers' : 'item_only');
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>All Day Mode</span>
            <span style={{ color: '#888' }}>{allDayViewMode === 'item_only' ? 'Items Only' : 'Items + Modifiers'}</span>
          </button>

          {/* Dining Options */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Dining Options
          </div>
          {['dine_in', 'takeout', 'delivery', 'curbside', 'online'].map(option => (
            <button
              key={option}
              onClick={() => {
                setSelectedDiningOptions(prev =>
                  prev.includes(option)
                    ? prev.filter(o => o !== option)
                    : [...prev, option]
                );
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: getDiningOptionColor(option)
                }} />
                {getDiningOptionLabel(option)}
              </span>
              <input
                type="checkbox"
                checked={selectedDiningOptions.includes(option)}
                readOnly
                style={{ cursor: 'pointer' }}
              />
            </button>
          ))}

          {/* Prep Stations */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Prep Stations
          </div>
          <button
            onClick={() => {
              setIsExpediter(!isExpediter);
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Expediter Mode</span>
            <span style={{ color: '#888' }}>{isExpediter ? 'On' : 'Off'}</span>
          </button>
          {prepStations.map(station => (
            <button
              key={station.id}
              onClick={() => {
                setSelectedPrepStations(prev =>
                  prev.includes(station.id)
                    ? prev.filter(s => s !== station.id)
                    : [...prev, station.id]
                );
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: station.color
                }} />
                {station.name}
              </span>
              <input
                type="checkbox"
                checked={selectedPrepStations.includes(station.id)}
                readOnly
                style={{ cursor: 'pointer' }}
              />
            </button>
          ))}

          {/* Assembly Line */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Assembly Line
          </div>
          <button
            onClick={() => {
              setAssemblyLineEnabled(!assemblyLineEnabled);
              if (!assemblyLineEnabled) {
                const sequence = prompt('Enter assembly sequence (comma-separated station IDs):', assemblySequence.join(','));
                if (sequence) {
                  setAssemblySequence(sequence.split(',').map(s => s.trim()));
                }
              }
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Assembly Line</span>
            <span style={{ color: '#888' }}>{assemblyLineEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Ticket Layout */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Ticket Layout
          </div>
          <button
            onClick={() => {
              setTicketLayout(prev => ({ ...prev, showCourse: !prev.showCourse }));
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Show Course</span>
            <span style={{ color: '#888' }}>{ticketLayout.showCourse ? 'On' : 'Off'}</span>
          </button>
          <button
            onClick={() => {
              setTicketLayout(prev => ({ ...prev, showModifiers: !prev.showModifiers }));
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Show Modifiers</span>
            <span style={{ color: '#888' }}>{ticketLayout.showModifiers ? 'On' : 'Off'}</span>
          </button>
          <button
            onClick={() => {
              setTicketLayout(prev => ({ ...prev, showTableNumber: !prev.showTableNumber }));
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Show Table Number</span>
            <span style={{ color: '#888' }}>{ticketLayout.showTableNumber ? 'On' : 'Off'}</span>
          </button>
          <button
            onClick={() => {
              setTicketLayout(prev => ({ ...prev, modifierDisplay: prev.modifierDisplay === 'vertical' ? 'horizontal' : 'vertical' }));
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Modifier Display</span>
            <span style={{ color: '#888' }}>{ticketLayout.modifierDisplay}</span>
          </button>

          {/* Performance */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Performance
          </div>
          <button
            onClick={() => {
              setShowPerformanceReport(!showPerformanceReport);
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Performance Report</span>
            <span style={{ color: '#888' }}>{showPerformanceReport ? 'On' : 'Off'}</span>
          </button>

          {/* Advanced Settings */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Advanced
          </div>
          <button
            onClick={() => {
              const time = prompt('Enter recently fulfilled timeframe (minutes):', recentlyFulfilledTimeframe);
              if (time && !isNaN(time)) {
                setRecentlyFulfilledTimeframe(parseInt(time));
              }
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Fulfilled Timeframe</span>
            <span style={{ color: '#888' }}>{recentlyFulfilledTimeframe} min</span>
          </button>
          <button
            onClick={() => {
              setDoubleTapEnabled(!doubleTapEnabled);
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Double-Tap Fulfill</span>
            <span style={{ color: '#888' }}>{doubleTapEnabled ? 'On' : 'Off'}</span>
          </button>
          <button
            onClick={() => {
              setLoadBalancingEnabled(!loadBalancingEnabled);
              setShowOverflowMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Load Balancing</span>
            <span style={{ color: '#888' }}>{loadBalancingEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Settings */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px', fontSize: '11px', color: '#888888', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Settings
          </div>
          <button
            onClick={() => {
              setShowOverflowMenu(false);
              alert('Opening KDS Appearance pane...');
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            KDS Appearance
          </button>
          <button
            onClick={() => {
              setShowOverflowMenu(false);
              alert('Opening KDS Settings...');
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            KDS Settings
          </button>
          <button
            onClick={() => {
              setShowOverflowMenu(false);
              alert('Opening Split Settings...');
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            Split Settings
          </button>

          {/* Close Button */}
          <div style={{ borderTop: '1px solid #404040', margin: '4px 0', padding: '8px 16px' }}>
            <button
              onClick={() => setShowOverflowMenu(false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#e74c3c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Toast-style Tab Navigation */}
      <div style={{
        padding: '8px 16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #404040',
        display: 'flex',
        gap: '4px',
        overflow: 'auto'
      }}>
        {['KDS', 'Tickets', 'Ticket Split', 'Waiting', 'By Table', 'By Product', 'Overview'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.toLowerCase().replace(' ', '_') ? '#4a90e2' : 'transparent',
              color: activeTab === tab.toLowerCase().replace(' ', '_') ? '#ffffff' : '#888888',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div
        data-ticket-area="true"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'auto',
          padding: '12px',
          gap: '12px',
          background: '#1a1a1a'
        }}>
        {/* All Day View */}
        {showAllDay && (
          <div style={{
            width: '100%',
            padding: '20px',
            background: '#2d2d2d',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
              All Day View
            </div>
            {Object.entries(getAllDayViewData()).map(([itemName, data]) => (
              <div key={itemName} style={{
                marginBottom: '16px',
                padding: '16px',
                background: '#252525',
                borderRadius: '6px',
                border: '1px solid #404040'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                    {itemName}
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#4a90e2'
                  }}>
                    {data.total}
                  </div>
                </div>
                {allDayViewMode === 'item_modifiers' && Object.keys(data.modifiers).length > 0 && (
                  <div style={{ marginLeft: '16px' }}>
                    {data.regular > 0 && (
                      <div style={{ fontSize: '14px', color: '#888888', marginBottom: '4px' }}>
                        Regular: {data.regular}
                      </div>
                    )}
                    {Object.entries(data.modifiers).map(([modifier, count]) => (
                      <div key={modifier} style={{ fontSize: '14px', color: '#888888', marginBottom: '4px' }}>
                        {modifier}: {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recently Fulfilled View */}
        {showRecentlyFulfilled && (
          <div style={{
            width: '100%',
            padding: '20px',
            background: '#2d2d2d',
            borderRadius: '6px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                Recently Fulfilled
              </div>
              {unfulfillMode && (
                <button
                  onClick={handleUnfulfill}
                  style={{
                    padding: '8px 16px',
                    background: '#4a90e2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Unfulfill Selected
                </button>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => setUnfulfillMode(!unfulfillMode)}
                style={{
                  padding: '8px 16px',
                  background: unfulfillMode ? '#f39c12' : '#3d3d3d',
                  color: '#ffffff',
                  border: '1px solid #555555',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {unfulfillMode ? 'Cancel Unfulfill' : 'Select to Unfulfill'}
              </button>
            </div>
            {getRecentlyFulfilledOrders().length === 0 ? (
              <div style={{ fontSize: '14px', color: '#888888' }}>
                No recently fulfilled tickets within {recentlyFulfilledTimeframe} minutes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {getRecentlyFulfilledOrders().map(order => (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (unfulfillMode) {
                        setSelectedForUnfulfill(prev =>
                          prev.includes(order.id)
                            ? prev.filter(id => id !== order.id)
                            : [...prev, order.id]
                        );
                      }
                    }}
                    style={{
                      width: '280px',
                      background: selectedForUnfulfill.includes(order.id) ? '#2a3a4a' : '#252525',
                      border: selectedForUnfulfill.includes(order.id) ? '2px solid #4a90e2' : '1px solid #404040',
                      borderRadius: '6px',
                      padding: '12px',
                      cursor: unfulfillMode ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                      #{order.id?.slice(-4) || '0000'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px' }}>
                      Completed: {order.completedAt ? new Date(order.completedAt).toLocaleTimeString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#27ae60' }}>
                      {order.items?.length} items
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        {!showAllDay && !showRecentlyFulfilled && (
          <>
            {activeTab === 'kds' && (
              /* KDS Tab - Standard ticket view */
              viewMode === 'dynamic' ? (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  width: '100%',
                  alignContent: 'flex-start'
                }}>
                  {pendingOrders.map((order, index) => {
                    const orderDiningOption = order.diningOption || 'dine_in';
                    const diningColor = getDiningOptionColor(orderDiningOption);
                    const processedOrder = assemblyLineEnabled ? processAssemblyLine(order) : order;

                    return (
                      <div
                        key={order.id}
                        onClick={(e) => {
                          if (correctionMode) {
                            setSelectedForCorrection(order.id);
                            const correctionType = prompt('Correction type (modify/cancel/item):');
                            if (correctionType) {
                                  const correctionData = prompt('Correction details:');
                                  if (correctionData) {
                                    handleCorrection(order.id, correctionType, correctionData);
                                  }
                                }
                              } else {
                                handleTicketTap(order.id, e);
                              }
                            }}
                        style={{
                          width: '280px',
                          background: selectedOrders.includes(order.id) ? '#2a3a4a' : '#2d2d2d',
                          border: `2px solid ${selectedOrders.includes(order.id) ? '#4a90e2' : diningColor}`,
                          borderRadius: '6px',
                          cursor: correctionMode ? 'pointer' : 'pointer',
                          overflow: 'hidden',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          position: 'relative'
                        }}
                      >
                        {/* Dining Option Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: diningColor
                        }} />

                        {/* Ticket Header */}
                        <div style={{
                          padding: '10px 12px',
                          background: '#3d3d3d',
                          borderBottom: '1px solid #404040',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                            #{order.id?.slice(-4) || '0000'}
                            {order.isRecalled && <span style={{ color: '#f39c12', marginLeft: '8px' }}>RECALLED</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888888' }}>
                            {fulfillmentTimers[order.id] ? `${Math.floor(fulfillmentTimers[order.id] / 60)}:${(fulfillmentTimers[order.id] % 60).toString().padStart(2, '0')}` : '--:--'}
                          </div>
                        </div>

                        {/* Ticket Content */}
                        <div style={{ padding: '12px' }}>
                          {/* Dining Option Badge */}
                          <div style={{
                            marginBottom: '8px',
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: diningColor,
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                          }}>
                            {getDiningOptionLabel(orderDiningOption)}
                          </div>

                          {/* Table/Customer Info */}
                          {ticketLayout.showTableNumber && (
                            <div style={{
                              marginBottom: '8px',
                              fontSize: '12px',
                              color: '#4a90e2',
                              fontWeight: '500'
                            }}>
                              {order.customer?.name || order.tableNumber ? `Table ${order.tableNumber || 'N/A'}` : 'Walk-in'}
                            </div>
                          )}

                          {/* Assembly Line View */}
                          {assemblyLineEnabled && processedOrder.assemblyLineItems ? (
                            <div style={{ marginBottom: '8px' }}>
                              {processedOrder.assemblyLineItems.map((stationGroup, idx) => (
                                <div key={idx} style={{
                                  marginBottom: '8px',
                                  padding: '8px',
                                  background: '#252525',
                                  borderRadius: '4px',
                                  borderLeft: `3px solid ${prepStations.find(s => s.name === stationGroup.station)?.color || '#4a90e2'}`
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#cccccc',
                                    marginBottom: '4px'
                                  }}>
                                    {stationGroup.sequence}. {stationGroup.station}
                                  </div>
                                  {stationGroup.items.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '4px',
                                      fontSize: '12px',
                                      color: '#ffffff'
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={item.status === 'COMPLETED'}
                                        readOnly
                                        style={{ marginRight: '6px', cursor: 'pointer' }}
                                      />
                                      <span>{item.quantity}x {item.name}</span>
                                      {ticketLayout.showModifiers && item.modifiers && item.modifiers.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#888888',
                                          marginLeft: '6px',
                                          fontStyle: 'italic'
                                        }}>
                                          ({ticketLayout.modifierDisplay === 'vertical' ? item.modifiers.join(', ') : item.modifiers.join(' ')})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Standard Course View */
                            <>
                              {ticketLayout.showCourse && order.items?.reduce((sections, item) => {
                                const section = item.category || 'Other';
                                if (!sections[section]) {
                                  sections[section] = [];
                                }
                                sections[section].push(item);
                                return sections;
                              }, {}) && Object.entries(order.items?.reduce((sections, item) => {
                                const section = item.category || 'Other';
                                if (!sections[section]) {
                                  sections[section] = [];
                                }
                                sections[section].push(item);
                                return sections;
                              }, {})).map(([section, items]) => (
                                <div key={section} style={{
                                  marginBottom: '8px',
                                  padding: '8px',
                                  background: '#252525',
                                  borderRadius: '4px'
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#cccccc',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    {section}
                                  </div>
                                  {items.map((item, itemIndex) => (
                                    <div key={itemIndex} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '4px',
                                      fontSize: '12px',
                                      color: '#ffffff'
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={item.status === 'COMPLETED'}
                                        readOnly
                                        style={{ marginRight: '6px', cursor: 'pointer' }}
                                      />
                                      <span>{item.quantity}x {item.name}</span>
                                      {ticketLayout.showModifiers && item.modifiers && item.modifiers.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#888888',
                                          marginLeft: '6px',
                                          fontStyle: 'italic'
                                        }}>
                                          ({ticketLayout.modifierDisplay === 'vertical' ? item.modifiers.join(', ') : item.modifiers.join(' ')})
                                        </span>
                                      )}
                                      {/* Color-coded allergies */}
                                      {item.allergies && item.allergies.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#e74c3c',
                                          marginLeft: '6px',
                                          fontWeight: 'bold'
                                        }}>
                                          ⚠️ {item.allergies.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Corrections History */}
                          {order.corrections && order.corrections.length > 0 && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px',
                              background: '#3d2a2a',
                              borderRadius: '4px',
                              border: '1px solid #e74c3c'
                            }}>
                              <div style={{ fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', marginBottom: '4px' }}>
                                Corrections: {order.corrections.length}
                              </div>
                              {order.corrections.slice(-2).map((correction, idx) => (
                                <div key={idx} style={{ fontSize: '9px', color: '#888888' }}>
                                  {correction.type}: {correction.data}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #404040'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedOrders = orders.map(o => {
                                  if (o.id === order.id) {
                                    return { ...o, status: 'COMPLETED', completedAt: new Date().toISOString() };
                                  }
                                  return o;
                                });
                                setOrders(updatedOrders);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#27ae60',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Done
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunnerFulfillment(order.id);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#9b59b6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Runner
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedOrders = orders.map(o => {
                                  if (o.id === order.id) {
                                    return { ...o, status: 'PENDING', recalledAt: new Date().toISOString() };
                                  }
                                  return o;
                                });
                                setOrders(updatedOrders);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#f39c12',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Recall
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = prompt('Enter cancellation reason:');
                                if (reason) {
                                  const updatedOrders = orders.map(o => {
                                    if (o.id === order.id) {
                                      return {
                                        ...o,
                                        status: 'CANCELLED',
                                        cancelledAt: new Date().toISOString(),
                                        cancellationReason: reason
                                      };
                                    }
                                    return o;
                                  });
                                  setOrders(updatedOrders);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#e74c3c',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Void
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Grid Layout */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                  width: '100%'
                }}>
                  {pendingOrders.map((order, index) => {
                    const orderDiningOption = order.diningOption || 'dine_in';
                    const diningColor = getDiningOptionColor(orderDiningOption);
                    const processedOrder = assemblyLineEnabled ? processAssemblyLine(order) : order;

                    return (
                      <div
                        key={order.id}
                        onClick={(e) => {
                          if (correctionMode) {
                            setSelectedForCorrection(order.id);
                            const correctionType = prompt('Correction type (modify/cancel/item):');
                            if (correctionType) {
                                  const correctionData = prompt('Correction details:');
                                  if (correctionData) {
                                    handleCorrection(order.id, correctionType, correctionData);
                                  }
                                }
                              } else {
                                handleTicketTap(order.id, e);
                              }
                            }}
                        style={{
                          background: selectedOrders.includes(order.id) ? '#2a3a4a' : '#2d2d2d',
                          border: `2px solid ${selectedOrders.includes(order.id) ? '#4a90e2' : diningColor}`,
                          borderRadius: '6px',
                          cursor: correctionMode ? 'pointer' : 'pointer',
                          overflow: 'hidden',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          minHeight: '200px',
                          position: 'relative'
                        }}
                      >
                        {/* Dining Option Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: diningColor
                        }} />

                        {/* Ticket Header */}
                        <div style={{
                          padding: '10px 12px',
                          background: '#3d3d3d',
                          borderBottom: '1px solid #404040',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                            #{order.id?.slice(-4) || '0000'}
                            {order.isRecalled && <span style={{ color: '#f39c12', marginLeft: '8px' }}>RECALLED</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888888' }}>
                            {fulfillmentTimers[order.id] ? `${Math.floor(fulfillmentTimers[order.id] / 60)}:${(fulfillmentTimers[order.id] % 60).toString().padStart(2, '0')}` : '--:--'}
                          </div>
                        </div>

                        {/* Ticket Content */}
                        <div style={{ padding: '12px' }}>
                          {/* Dining Option Badge */}
                          <div style={{
                            marginBottom: '8px',
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: diningColor,
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                          }}>
                            {getDiningOptionLabel(orderDiningOption)}
                          </div>

                          {/* Table/Customer Info */}
                          {ticketLayout.showTableNumber && (
                            <div style={{
                              marginBottom: '8px',
                              fontSize: '12px',
                              color: '#4a90e2',
                              fontWeight: '500'
                            }}>
                              {order.customer?.name || order.tableNumber ? `Table ${order.tableNumber || 'N/A'}` : 'Walk-in'}
                            </div>
                          )}

                          {/* Assembly Line View */}
                          {assemblyLineEnabled && processedOrder.assemblyLineItems ? (
                            <div style={{ marginBottom: '8px' }}>
                              {processedOrder.assemblyLineItems.map((stationGroup, idx) => (
                                <div key={idx} style={{
                                  marginBottom: '8px',
                                  padding: '8px',
                                  background: '#252525',
                                  borderRadius: '4px',
                                  borderLeft: `3px solid ${prepStations.find(s => s.name === stationGroup.station)?.color || '#4a90e2'}`
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#cccccc',
                                    marginBottom: '4px'
                                  }}>
                                    {stationGroup.sequence}. {stationGroup.station}
                                  </div>
                                  {stationGroup.items.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '4px',
                                      fontSize: '12px',
                                      color: '#ffffff'
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={item.status === 'COMPLETED'}
                                        readOnly
                                        style={{ marginRight: '6px', cursor: 'pointer' }}
                                      />
                                      <span>{item.quantity}x {item.name}</span>
                                      {ticketLayout.showModifiers && item.modifiers && item.modifiers.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#888888',
                                          marginLeft: '6px',
                                          fontStyle: 'italic'
                                        }}>
                                          ({ticketLayout.modifierDisplay === 'vertical' ? item.modifiers.join(', ') : item.modifiers.join(' ')})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Standard Course View */
                            <>
                              {ticketLayout.showCourse && order.items?.reduce((sections, item) => {
                                const section = item.category || 'Other';
                                if (!sections[section]) {
                                  sections[section] = [];
                                }
                                sections[section].push(item);
                                return sections;
                              }, {}) && Object.entries(order.items?.reduce((sections, item) => {
                                const section = item.category || 'Other';
                                if (!sections[section]) {
                                  sections[section] = [];
                                }
                                sections[section].push(item);
                                return sections;
                              }, {})).map(([section, items]) => (
                                <div key={section} style={{
                                  marginBottom: '8px',
                                  padding: '8px',
                                  background: '#252525',
                                  borderRadius: '4px'
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#cccccc',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    {section}
                                  </div>
                                  {items.map((item, itemIndex) => (
                                    <div key={itemIndex} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '4px',
                                      fontSize: '12px',
                                      color: '#ffffff'
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={item.status === 'COMPLETED'}
                                        readOnly
                                        style={{ marginRight: '6px', cursor: 'pointer' }}
                                      />
                                      <span>{item.quantity}x {item.name}</span>
                                      {ticketLayout.showModifiers && item.modifiers && item.modifiers.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#888888',
                                          marginLeft: '6px',
                                          fontStyle: 'italic'
                                        }}>
                                          ({ticketLayout.modifierDisplay === 'vertical' ? item.modifiers.join(', ') : item.modifiers.join(' ')})
                                        </span>
                                      )}
                                      {/* Color-coded allergies */}
                                      {item.allergies && item.allergies.length > 0 && (
                                        <span style={{
                                          fontSize: '10px',
                                          color: '#e74c3c',
                                          marginLeft: '6px',
                                          fontWeight: 'bold'
                                        }}>
                                          ⚠️ {item.allergies.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Corrections History */}
                          {order.corrections && order.corrections.length > 0 && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px',
                              background: '#3d2a2a',
                              borderRadius: '4px',
                              border: '1px solid #e74c3c'
                            }}>
                              <div style={{ fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', marginBottom: '4px' }}>
                                Corrections: {order.corrections.length}
                              </div>
                              {order.corrections.slice(-2).map((correction, idx) => (
                                <div key={idx} style={{ fontSize: '9px', color: '#888888' }}>
                                  {correction.type}: {correction.data}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #404040'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedOrders = orders.map(o => {
                                  if (o.id === order.id) {
                                    return { ...o, status: 'COMPLETED', completedAt: new Date().toISOString() };
                                  }
                                  return o;
                                });
                                setOrders(updatedOrders);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#27ae60',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Done
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunnerFulfillment(order.id);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#9b59b6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Runner
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedOrders = orders.map(o => {
                                  if (o.id === order.id) {
                                    return { ...o, status: 'PENDING', recalledAt: new Date().toISOString() };
                                  }
                                  return o;
                                });
                                setOrders(updatedOrders);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#f39c12',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Recall
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = prompt('Enter cancellation reason:');
                                if (reason) {
                                  const updatedOrders = orders.map(o => {
                                    if (o.id === order.id) {
                                      return {
                                        ...o,
                                        status: 'CANCELLED',
                                        cancelledAt: new Date().toISOString(),
                                        cancellationReason: reason
                                      };
                                    }
                                    return o;
                                  });
                                  setOrders(updatedOrders);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#e74c3c',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Void
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {activeTab === 'tickets' && (
              /* Tickets Tab - All tickets */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  All Tickets
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {getOrdersByDiningOptions().map(order => (
                    <div key={order.id} style={{
                      width: '280px',
                      background: '#252525',
                      border: `1px solid ${order.status === 'COMPLETED' ? '#27ae60' : order.status === 'CANCELLED' ? '#e74c3c' : '#404040'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                        #{order.id?.slice(-4) || '0000'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px' }}>
                        Status: {order.status}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4a90e2' }}>
                        {order.items?.length} items
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ticket_split' && (
              /* Ticket Split Tab - Split by course/individual items */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  Ticket Split Options
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      setTicketLayout(prev => ({ ...prev, showCourse: true, consolidateItems: false }));
                      alert('Split by Course enabled');
                    }}
                    style={{
                      padding: '10px 16px',
                      background: '#4a90e2',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Split by Course
                  </button>
                  <button
                    onClick={() => {
                      setTicketLayout(prev => ({ ...prev, showCourse: false, consolidateItems: false }));
                      alert('Individual Items enabled');
                    }}
                    style={{
                      padding: '10px 16px',
                      background: '#3d3d3d',
                      color: '#ffffff',
                      border: '1px solid #555555',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Individual Items
                  </button>
                  <button
                    onClick={() => {
                      setTicketLayout(prev => ({ ...prev, showCourse: true, consolidateItems: true }));
                      alert('Single Ticket enabled');
                    }}
                    style={{
                      padding: '10px 16px',
                      background: '#3d3d3d',
                      color: '#ffffff',
                      border: '1px solid #555555',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Single Ticket
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#888888' }}>
                  Select a split option to configure how tickets are organized.
                </div>
              </div>
            )}

            {activeTab === 'waiting' && (
              /* Waiting Tab - Orders not yet fired */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  Waiting Orders
                </div>
                {getWaitingOrders().length === 0 ? (
                  <div style={{ fontSize: '14px', color: '#888888' }}>
                    No waiting orders.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {getWaitingOrders().map(order => (
                      <div key={order.id} style={{
                        width: '280px',
                        background: '#252525',
                        border: '1px solid #f39c12',
                        borderRadius: '6px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                          #{order.id?.slice(-4) || '0000'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px' }}>
                          Status: {order.status}
                        </div>
                        <button
                          onClick={() => {
                            const updatedOrders = orders.map(o => {
                              if (o.id === order.id) {
                                return { ...o, status: 'PENDING', firedAt: new Date().toISOString() };
                              }
                              return o;
                            });
                            setOrders(updatedOrders);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: '#27ae60',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Fire to Kitchen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'by_table' && (
              /* By Table Tab - Group by table number */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  By Table
                </div>
                {Object.entries(getByTableData()).map(([tableNum, tableOrders]) => (
                  <div key={tableNum} style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: '#252525',
                    borderRadius: '6px',
                    border: '1px solid #404040'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
                      {tableNum} ({tableOrders.length} orders)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {tableOrders.map(order => (
                        <div key={order.id} style={{
                          padding: '8px 12px',
                          background: '#1a1a1a',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#ffffff'
                        }}>
                          #{order.id?.slice(-4) || '0000'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'by_product' && (
              /* By Product Tab - Group by items/products */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  By Product
                </div>
                {Object.entries(getByProductData()).map(([productName, productData]) => (
                  <div key={productName} style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: '#252525',
                    borderRadius: '6px',
                    border: '1px solid #404040'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
                      {productName} ({productData.length} instances)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {productData.map(({ order }, index) => (
                        <div key={`${order.id}-${index}`} style={{
                          padding: '8px 12px',
                          background: '#1a1a1a',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#ffffff'
                        }}>
                          #{order.id?.slice(-4) || '0000'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'overview' && (
              /* Overview Tab - Summary statistics */
              <div style={{ width: '100%', padding: '20px', background: '#2d2d2d', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  Overview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {Object.entries(getOverviewData()).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '16px',
                      background: '#252525',
                      borderRadius: '6px',
                      border: '1px solid #404040',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#888888', marginBottom: '8px' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast-style Bottom Panel */}
      <div style={{
        padding: '12px 16px',
        background: '#2d2d2d',
        borderTop: '1px solid #404040',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: Ticket Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', color: '#888888' }}>
            Total Tickets: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{totalTickets}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#888888' }}>
            Pending: <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{pendingOrders.length}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#888888' }}>
            Completed: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{completedOrders.length}</span>
          </div>
          {loadBalancingEnabled && (
            <div style={{ fontSize: '14px', color: '#888888' }}>
              Load Balance: <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                {balanceLoadAcrossStations()[0]?.[0] || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Navigation Arrows */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCorrectionMode(!correctionMode)}
            style={{
              padding: '8px 12px',
              background: correctionMode ? '#e74c3c' : '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #555555',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {correctionMode ? 'Exit Correction' : 'Corrections'}
          </button>
          <button
            onClick={handleScrollToStart}
            style={{
              padding: '8px 12px',
              background: '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #555555',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <button
            onClick={handleScrollToEnd}
            style={{
              padding: '8px 12px',
              background: '#3d3d3d',
              color: '#ffffff',
              border: '1px solid #555555',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Performance Report Panel */}
      {showPerformanceReport && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '16px',
          background: '#2d2d2d',
          border: '1px solid #404040',
          borderRadius: '6px',
          padding: '16px',
          zIndex: 1000,
          minWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
              Kitchen Performance
            </div>
            <button
              onClick={() => setShowPerformanceReport(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888888',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#252525', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#888888', marginBottom: '4px' }}>Avg Fulfillment</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a90e2' }}>
                {Math.floor(performanceMetrics.averageFulfillmentTime / 60)}:{(performanceMetrics.averageFulfillmentTime % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#252525', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#888888', marginBottom: '4px' }}>Tickets/Hour</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                {performanceMetrics.ticketsPerHour}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#252525', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#888888', marginBottom: '4px' }}>Items/Ticket</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>
                {performanceMetrics.itemsPerTicket}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#252525', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#888888', marginBottom: '4px' }}>Error Rate</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                {performanceMetrics.errorRate}%
              </div>
            </div>
            <div style={{ padding: '12px', background: '#252525', borderRadius: '4px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '11px', color: '#888888', marginBottom: '4px' }}>On-Time Rate</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9b59b6' }}>
                {performanceMetrics.onTimeRate}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
