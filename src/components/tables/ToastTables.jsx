import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import PaymentModal from '../pos/PaymentModal';
import Receipt from '../pos/Receipt';
import { getKOTManager } from '../../operations/KOTManager.js';
import orderEventManager from '../../services/OrderEventManager.js';
import orderWorkflowService from '../../services/OrderWorkflowService.js';

// Helper functions for element preview
const getElementColor = (type) => {
  const colors = {
    table: '#6366f1',
    wall: '#64748b',
    door: '#a855f7',
    window: '#06b6d4',
    pillar: '#854d0e',
    bar_counter: '#d97706',
    entrance: '#10b981',
    stage: '#ec4899'
  };
  return colors[type] || '#6366f1';
};

const getElementIcon = (type) => {
  const icons = {
    table: '🪑',
    wall: '🧱',
    door: '🚪',
    window: '🪟',
    pillar: '🏛️',
    bar_counter: '🍸',
    entrance: '🚶',
    stage: '🎭'
  };
  return icons[type] || '●';
};

const getBorderStyle = (type, wallType) => {
  if (type === 'wall' || type === 'door' || type === 'window') {
    const styles = {
      solid: '2px solid #94a3b8',
      glass: '2px solid #06b6d4',
      curtain: '2px dashed #94a3b8',
      railing: '2px dotted #94a3b8',
      plant: '2px solid #22c55e'
    };
    return styles[wallType] || '2px solid #94a3b8';
  }
  return '2px solid #6366f1';
};

let chequeSeq = 300;
const generateChequeId = () => {
  chequeSeq += 1;
  return `#C${chequeSeq}`;
};

function useScreenSize() {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setScreenSize('mobile');
      } else if (w < 1100) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

export default function ToastTables({
  onNavigate,
  orders = [],
  setOrders,
  tables: propTables = [],
  setTables: setPropTables,
  customers = [],
  setCustomers,
  menuItems = [],
  settings = {},
  staff = [],
  darkMode = false
}) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';

  // Theme colors based on dark mode (matching Settings theme)
  const theme = {
    bg: darkMode ? '#0f0f0f' : '#f8fafc',
    bgEle: darkMode ? '#1a1a1a' : '#ffffff',
    bgCard: darkMode ? '#1e1e1e' : '#ffffff',
    bgInput: darkMode ? '#2a2a2a' : '#f1f5f9',
    bgSecondary: darkMode ? '#1a1a1a' : '#f1f5f9',
    bgTertiary: darkMode ? '#333333' : '#e2e8f0',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textSecondary: darkMode ? '#cbd5e1' : '#475569',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#cbd5e1',
    borderLight: darkMode ? '#475569' : '#e2e8f0',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    shadow: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'
  };

  // Section Sidebar filter
  const [selectedSection, setSelectedSection] = useState('Main');
  
  // Handheld Toast Go layout mode state
  const [isToastGoHandheld, setIsToastGoHandheld] = useState(false);

  // New Modals: Table Transfer, N-Way Bill Split, Timed Prep Hold
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetTableId, setTransferTargetTableId] = useState('');
  const [showNWaySplitModal, setShowNWaySplitModal] = useState(false);
  const [nWaySplitCount, setNWaySplitCount] = useState(2);
  const [showTimedHoldModal, setShowTimedHoldModal] = useState(false);
  const [timedHoldMinutes, setTimedHoldMinutes] = useState(15);
  
  // Selected table ID
  const [selectedTableId, setSelectedTableId] = useState(14);

  // Active cheque selection & seat filter
  const [activeChequeId, setActiveChequeId] = useState('#C198');
  const [selectedSeatId, setSelectedSeatId] = useState('All');
  const [itemSortKey, setItemSortKey] = useState(null); // 'qty' | 'article' | 'price'
  const [itemSortDir, setItemSortDir] = useState('asc'); // 'asc' | 'desc'
  const [activeTab, setActiveTab] = useState('Bill'); // 'Bill' or 'Logs'

  // Mobile active panel view ('floor' | 'bill' | 'sections')
  const [mobilePanel, setMobilePanel] = useState('floor');

  // Feature 1: Layout Editor Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newElementData, setNewElementData] = useState({ name: '', shape: 'rect', type: 'table' });
  const [draggedElement, setDraggedElement] = useState(null);
  const canvasRef = useRef(null);

  // Feature 3: Table Merges State
  const [tableMerges, setTableMerges] = useState([
    { table1: 12, table2: 13 }
  ]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [targetMergeTableId, setTargetMergeTableId] = useState('');

  // Feature 6: Customer / Reservation Pairing State
  const [showCustomerPairModal, setShowCustomerPairModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', points: 50 });
  const defaultTableCustomers = {
    14: { name: 'Ankit Patel', phone: '+91 9876543210', points: 140 }
  };

  const [tableCustomers, setTableCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('toast_tables_table_customers');
      return saved ? JSON.parse(saved) : defaultTableCustomers;
    } catch (e) {
      console.error('Failed to parse persistent table customers:', e);
      return defaultTableCustomers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('toast_tables_table_customers', JSON.stringify(tableCustomers));
    } catch (e) {
      console.error('Failed to persist table customers:', e);
    }
  }, [tableCustomers]);

  // Search across all tables
  const [floorSearchQuery, setFloorSearchQuery] = useState('');

  // Toast Notification System State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const askConfirmation = (title, message, onConfirm) => {
    setConfirmModalConfig({ title, message, onConfirm });
  };

  // Item-level Split Cheque Modal Selection State
  const [selectedSplitItemIds, setSelectedSplitItemIds] = useState([]);

  // Explicit Seat Prompt State for Add Item / POS
  const [targetSeatForAdd, setTargetSeatForAdd] = useState(1);
  const [showSeatPromptModal, setShowSeatPromptModal] = useState(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState(null);

  // Partial Payment State
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  // Modal states for buttons & Quick POS
  const [showQuickPOSModal, setShowQuickPOSModal] = useState(false);
  const [quickPOSCategory, setQuickPOSCategory] = useState('All');
  const [quickPOSSearch, setQuickPOSSearch] = useState('');
  const [quickPOSCart, setQuickPOSCart] = useState([]);
  const [quickPOSSelectedSeat, setQuickPOSSelectedSeat] = useState(1);
  const [quickPOSOrderNote, setQuickPOSOrderNote] = useState('');

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [kitchenMessage, setKitchenMessage] = useState('');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmountInput, setDiscountAmountInput] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Manager Void & Guest Count Editing State
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [itemToVoid, setItemToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('Customer changed mind');
  const [managerPin, setManagerPin] = useState('');
  const [showGuestsModal, setShowGuestsModal] = useState(false);
  const [editGuestCount, setEditGuestCount] = useState(2);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tableNote, setTableNote] = useState('');
  const [showMenuModal, setShowMenuModal] = useState(false);

  const defaultTableLogs = {
    14: [
      { id: 1, text: 'Table seated with 2 guests', time: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} 14:35`, staff: 'Rahul (Cashier)' },
      { id: 2, text: 'Order #C198 created', time: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} 14:36`, staff: 'Rahul (Cashier)' },
      { id: 3, text: 'KOT sent to Kitchen station', time: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} 14:37`, staff: 'System' }
    ],
    2: [
      { id: 1, text: 'Table seated with 4 guests', time: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} 14:10`, staff: 'Priya (Server)' },
      { id: 2, text: 'Order #C190 created', time: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} 14:12`, staff: 'Priya (Server)' }
    ]
  };

  // Persistent Action Logs state per table
  const [tableLogs, setTableLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('toast_tables_table_logs');
      return saved ? JSON.parse(saved) : defaultTableLogs;
    } catch (e) {
      console.error('Failed to parse persistent table logs:', e);
      return defaultTableLogs;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('toast_tables_table_logs', JSON.stringify(tableLogs));
    } catch (e) {
      console.error('Failed to persist table logs:', e);
    }
  }, [tableLogs]);

  const addLog = useCallback((tableId, text) => {
    const time = `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const activeStaffMember = staff && staff.length > 0 ? (staff[0].name || staff[0].role || 'Staff') : 'Cashier';
    setTableLogs(prev => {
      const existing = prev[tableId] || [];
      const updated = [
        ...existing,
        { id: Date.now(), text, time, staff: activeStaffMember }
      ].slice(-50); // Cap at latest 50 entries per table for memory efficiency
      return {
        ...prev,
        [tableId]: updated
      };
    });
  }, [staff]);

  // Multi-Level Floor Plan Canvas Layout Map Collections
  const defaultFloorTables = [
    // Main Floor
    { id: 1, number: '1', name: '1', shape: 'rect', x: 6, y: 4, wPct: 11, hPct: 13, status: 'available', section: 'Main' },
    { id: 101, number: 'BAR', name: 'BAR', shape: 'rect', x: 26, y: 4, wPct: 15, hPct: 13, status: 'available', section: 'Main' },
    { id: 102, number: 'BAR2', name: 'BAR2', shape: 'rect', x: 48, y: 4, wPct: 15, hPct: 13, status: 'available', section: 'Main' },

    { id: 2, number: '2', name: '2', shape: 'rect', x: 6, y: 22, wPct: 15, hPct: 13, status: 'occupied', guests: 4, seatedAt: Date.now() - 48 * 60 * 1000, section: 'Main' },
    { id: 4, number: '4', name: '4', shape: 'circle', x: 28, y: 22, wPct: 11, hPct: 13, status: 'available', section: 'Main' },
    { id: 14, number: '14', name: '14', shape: 'rect', x: 44, y: 22, wPct: 11, hPct: 13, status: 'occupied', guests: 2, seatedAt: Date.now() - 15 * 60 * 1000, section: 'Main', chequeId: '#C198' },
    { id: 15, number: '15', name: '15', shape: 'circle', x: 60, y: 22, wPct: 11, hPct: 13, status: 'available', section: 'Main' },
    { id: 8, number: '8', name: '8', shape: 'circle', x: 78, y: 22, wPct: 12, hPct: 14, status: 'available', section: 'Main' },

    { id: 3, number: '3', name: '3', shape: 'rect', x: 6, y: 40, wPct: 11, hPct: 13, status: 'available', section: 'Main' },
    { id: 9, number: '9', name: '9', shape: 'circle', x: 28, y: 42, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 19, number: '19', name: '19', shape: 'rect', x: 44, y: 42, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 16, number: '16', name: '16', shape: 'rect', x: 60, y: 42, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 11, number: '11', name: '11', shape: 'rect', x: 75, y: 40, wPct: 15, hPct: 13, status: 'occupied', guests: 3, seatedAt: Date.now() - 65 * 60 * 1000, badge: 'VIP', section: 'Main' },

    { id: 5, number: '5', name: '5', shape: 'rect', x: 6, y: 60, wPct: 10, hPct: 12, status: 'occupied', guests: 2, seatedAt: Date.now() - 20 * 60 * 1000, section: 'Main' },
    { id: 6, number: '6', name: '6', shape: 'rect', x: 19, y: 60, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 12, number: '12', name: '12', shape: 'rect', x: 32, y: 60, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 13, number: '13', name: '13', shape: 'rect', x: 45, y: 60, wPct: 10, hPct: 12, status: 'available', section: 'Main' },
    { id: 18, number: '18', name: '18', shape: 'rect', x: 58, y: 60, wPct: 10, hPct: 12, status: 'occupied', guests: 2, seatedAt: Date.now() - 10 * 60 * 1000, section: 'Main' },
    { id: 17, number: '17', name: '17', shape: 'rect', x: 71, y: 60, wPct: 10, hPct: 12, status: 'cleaning', section: 'Main' },
    { id: 10, number: '10', name: '10', shape: 'circle', x: 84, y: 58, wPct: 12, hPct: 14, status: 'occupied', guests: 3, seatedAt: Date.now() - 55 * 60 * 1000, section: 'Main' },

    // Patio & Outside
    { id: 201, number: 'P1', name: 'Patio 1', shape: 'circle', x: 10, y: 15, wPct: 14, hPct: 16, status: 'available', section: 'Outside' },
    { id: 202, number: 'P2', name: 'Patio 2', shape: 'circle', x: 35, y: 15, wPct: 14, hPct: 16, status: 'occupied', guests: 4, seatedAt: Date.now() - 12 * 60 * 1000, section: 'Outside' },
    { id: 203, number: 'P3', name: 'Patio 3', shape: 'rect', x: 60, y: 15, wPct: 16, hPct: 16, status: 'available', section: 'Outside' },
    { id: 204, number: 'P4', name: 'Patio 4', shape: 'rect', x: 20, y: 50, wPct: 18, hPct: 18, status: 'available', section: 'Outside' },

    // The Bar section
    { id: 301, number: 'B1', name: 'Bar Seat 1', shape: 'circle', x: 15, y: 25, wPct: 10, hPct: 12, status: 'occupied', guests: 1, seatedAt: Date.now() - 5 * 60 * 1000, section: 'The Bar' },
    { id: 302, number: 'B2', name: 'Bar Seat 2', shape: 'circle', x: 30, y: 25, wPct: 10, hPct: 12, status: 'occupied', guests: 1, seatedAt: Date.now() - 8 * 60 * 1000, section: 'The Bar' },
    { id: 303, number: 'B3', name: 'Bar Seat 3', shape: 'circle', x: 45, y: 25, wPct: 10, hPct: 12, status: 'available', section: 'The Bar' },

    // 2nd Floor VIP Lounge
    { id: 401, number: 'VIP-A', name: 'Lounge Suite A', shape: 'rect', x: 15, y: 20, wPct: 25, hPct: 22, status: 'occupied', guests: 8, badge: 'VIP', seatedAt: Date.now() - 40 * 60 * 1000, section: 'Open' },
    { id: 402, number: 'VIP-B', name: 'Lounge Suite B', shape: 'rect', x: 55, y: 20, wPct: 25, hPct: 22, status: 'available', section: 'Open' }
  ];

  // Canonical table matching helper function
  const matchTableCanonical = (t, key) => {
    if (!t || key === undefined || key === null) return false;
    const k = key.toString().trim().toLowerCase();
    const tId = t.id ? t.id.toString().trim().toLowerCase() : '';
    const tNum = t.number ? t.number.toString().trim().toLowerCase() : '';
    const tName = t.name ? t.name.toString().trim().toLowerCase() : '';
    return k === tId || k === tNum || k === tName;
  };

  const [floorTables, setFloorTables] = useState(() => {
    try {
      const saved = localStorage.getItem('toast_tables_floorplan');
      return saved ? JSON.parse(saved) : defaultFloorTables;
    } catch (err) {
      console.error('Failed to load floor plan from localStorage:', err);
      return defaultFloorTables;
    }
  });

  // Feature 2: Seating Duration Timer & Color Stage Helper
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getTableSeatingStage = (table) => {
    if (!table || table.status !== 'occupied' || !table.seatedAt) {
      return { label: '0m', color: '#10b981', stage: 'available' };
    }

    const elapsedMins = Math.floor((nowTick - table.seatedAt) / 60000);
    const hrs = Math.floor(elapsedMins / 60);
    const mins = elapsedMins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const currentBadges = table.badges || (table.badge ? [table.badge] : []);
    const isExempt = currentBadges.includes('VIP') || currentBadges.includes('Do Not Rush');

    if (isExempt) {
      return { label: `${timeStr} ⭐`, color: '#64748b', stage: 'exempt' }; // Gray exempt for VIP / Do Not Rush
    }

    const freshThreshold = settings?.turnTimeFresh || 30;
    const warningThreshold = settings?.turnTimeWarning || 50;

    if (elapsedMins < freshThreshold) {
      return { label: timeStr, color: '#10b981', stage: 'fresh' };
    } else if (elapsedMins < warningThreshold) {
      return { label: timeStr, color: '#f59e0b', stage: 'warning' };
    } else {
      return { label: timeStr, color: '#ef4444', stage: 'overdue' };
    }
  };

  // Sync propTables with floorTables status
  useEffect(() => {
    if (propTables && propTables.length > 0) {
      setFloorTables(prev => prev.map(ft => {
        const propMatch = propTables.find(pt => matchTableCanonical(ft, pt.number) || matchTableCanonical(ft, pt.id) || matchTableCanonical(ft, pt.name));
        if (propMatch) {
          return {
            ...ft,
            status: propMatch.status || ft.status,
            guests: propMatch.guestCount || propMatch.guests || ft.guests
          };
        }
        return ft;
      }));
    }
  }, [propTables]);

  // Real-time QR Code Ordering Pairing Hook
  useEffect(() => {
    const handleQROrder = (e) => {
      const qrData = e.detail || {};
      const targetKey = qrData.tableNumber || qrData.tableId || '14';

      setFloorTables(prev => {
        const matchTable = prev.find(ft => matchTableCanonical(ft, targetKey));
        if (!matchTable) return prev;

        // Add QR items directly to table bill cheque using functional state update
        const qrChequeId = `#QR-${Date.now().toString(36).slice(-4)}-${Math.floor(Math.random() * 1000)}`;
        setTableBills(prevBills => {
          const existingCheques = prevBills[matchTable.id]?.cheques || [];
          return {
            ...prevBills,
            [matchTable.id]: {
              cheques: [...existingCheques, {
                id: qrChequeId,
                items: (qrData.items || []).map((i, idx) => ({
                  id: `qr-item-${Date.now()}-${idx}`,
                  name: i.name,
                  qty: i.quantity || i.qty || 1,
                  price: i.price || 0,
                  seat: i.seat || 1,
                  currency: '₹',
                  tag: 'QR'
                })),
                discount: 0,
                notes: `📱 Table Self-Scan QR Order (Customer: ${qrData.customerName || 'Guest'})`
              }]
            }
          };
        });

        addLog(matchTable.id, `📱 Incoming Table QR Order received (${(qrData.items || []).length} items)`);

        return prev.map(ft => ft.id === matchTable.id ? {
          ...ft,
          status: 'occupied',
          badge: '📱 QR ORDER',
          seatedAt: ft.seatedAt || Date.now()
        } : ft);
      });
    };

    window.addEventListener('toast_qr_order_submitted', handleQROrder);
    window.addEventListener('bakerypos_qr_order', handleQROrder);

    return () => {
      window.removeEventListener('toast_qr_order_submitted', handleQROrder);
      window.removeEventListener('bakerypos_qr_order', handleQROrder);
    };
  }, []);

  // Sync global `orders` prop across all layouts into `tableBills` & `floorTables`
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const activeOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

    activeOrders.forEach(ord => {
      if (!ord.tableNumber) return;

      setFloorTables(prevTables => {
        const matchTable = prevTables.find(ft => matchTableCanonical(ft, ord.tableNumber));
        if (!matchTable) return prevTables;

        // Update table bills for matched table
        const chequeId = ord.chequeId || `#C${ord.id.toString().slice(-4)}`;
        setTableBills(prevBills => {
          const existingCheques = prevBills[matchTable.id]?.cheques || [];
          if (existingCheques.some(c => c.id === chequeId)) return prevBills;

          return {
            ...prevBills,
            [matchTable.id]: {
              cheques: [...existingCheques, {
                id: chequeId,
                items: (ord.items || []).map((i, idx) => ({
                  id: i.id || `item-${Date.now()}-${idx}`,
                  name: i.name,
                  qty: i.quantity || i.qty || 1,
                  price: i.price || 0,
                  seat: i.seat || 1,
                  currency: '₹'
                })),
                discount: ord.discount || 0
              }]
            }
          };
        });

        return prevTables.map(ft => ft.id === matchTable.id ? {
          ...ft,
          status: 'occupied',
          seatedAt: ft.seatedAt || Date.now()
        } : ft);
      });
    });
  }, [orders]);

  const defaultTableBills = {
    14: {
      cheques: [
        {
          id: '#C198',
          items: [
            { id: 'item-1', name: 'Fried Calamari', qty: 2, price: 340.00, tag: 'ST', seat: 1, currency: '₹' },
            { id: 'item-2', name: 'Coca cola zero', qty: 2, price: 90.00, tag: null, seat: 1, currency: '₹' },
            { id: 'item-3', name: 'Tiramisu', qty: 2, price: 250.00, tag: 'DS', seat: 2, currency: '₹' },
          ],
          discount: 0,
          notes: ''
        }
      ]
    },
    2: {
      cheques: [
        {
          id: '#C190',
          items: [
            { id: 'item-4', name: 'Avocado Toast', qty: 2, price: 280.00, tag: 'BR', seat: 1, currency: '₹' },
            { id: 'item-5', name: 'Cappuccino', qty: 2, price: 180.00, tag: null, seat: 2, currency: '₹' }
          ],
          discount: 0,
          notes: 'Extra hot coffee'
        }
      ]
    },
    11: {
      cheques: [
        {
          id: '#C201',
          items: [
            { id: 'item-6', name: 'Roast Herb Chicken', qty: 2, price: 520.00, tag: 'MN', seat: 1, currency: '₹' },
            { id: 'item-7', name: 'Mango Alphonso Lassi', qty: 1, price: 220.00, tag: 'BV', seat: 2, currency: '₹' }
          ],
          discount: 100.00,
          notes: 'VIP customer table'
        }
      ]
    }
  };

  // Persistent Table Bills state with localStorage fallback
  const [tableBills, setTableBills] = useState(() => {
    try {
      const saved = localStorage.getItem('toast_tables_table_bills');
      return saved ? JSON.parse(saved) : defaultTableBills;
    } catch (e) {
      console.error('Failed to parse persistent table bills:', e);
      return defaultTableBills;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('toast_tables_table_bills', JSON.stringify(tableBills));
    } catch (e) {
      console.error('Failed to persist table bills:', e);
    }
  }, [tableBills]);

  // Sync floorTables status to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('toast_tables_floorplan', JSON.stringify(floorTables));
    } catch (e) {
      console.error('Failed to persist floor plan:', e);
    }
  }, [floorTables]);

  // Real-time order event synchronization
  useEffect(() => {
    // Subscribe to order events
    const unsubscribeOrderCreated = orderEventManager.on('order:created', (order) => {
      console.log('[ToastTables] Order created:', order.id);
      if (order.tableId) {
        // Update table with new order
        setFloorTables(prev => prev.map(t => 
          t.id === order.tableId || matchTableCanonical(t, order.tableId)
            ? { ...t, status: 'occupied', hasOrder: true }
            : t
        ));
        
        // Add log entry
        addLog(order.tableId, `Order ${order.id} created`);
      }
    });

    const unsubscribeOrderUpdated = orderEventManager.on('order:updated', ({ order, changes }) => {
      console.log('[ToastTables] Order updated:', order.id);
      if (order.tableId) {
        // Update table bills when order is updated
        if (changes.items || changes.addItem) {
          setTableBills(prev => {
            const existing = prev[order.tableId] || { cheques: [] };
            const updatedCheques = existing.cheques.map(cheque => {
              if (cheque.id === order.chequeId) {
                return {
                  ...cheque,
                  items: order.items || changes.items || cheque.items
                };
              }
              return cheque;
            });
            
            return {
              ...prev,
              [order.tableId]: { cheques: updatedCheques }
            };
          });
        }
      }
    });

    const unsubscribeOrderFired = orderEventManager.on('order:fired', ({ order, kotData }) => {
      console.log('[ToastTables] Order fired to kitchen:', order.id);
      if (order.tableId) {
        addLog(order.tableId, `KOT sent to kitchen for order ${order.id}`);
      }
    });

    const unsubscribeOrderCompleted = orderEventManager.on('order:completed', (order) => {
      console.log('[ToastTables] Order completed:', order.id);
      if (order.tableId) {
        addLog(order.tableId, `Order ${order.id} completed`);
      }
    });

    const unsubscribeOrderPaid = orderEventManager.on('order:paid', ({ order, paymentData }) => {
      console.log('[ToastTables] Order paid:', order.id);
      if (order.tableId) {
        addLog(order.tableId, `Payment processed for order ${order.id}`);
        
        // Check if table should be cleared
        const table = floorTables.find(t => t.id === order.tableId || matchTableCanonical(t, order.tableId));
        if (table && table.autoClearOnPayment) {
          setFloorTables(prev => prev.map(t => 
            t.id === order.tableId || matchTableCanonical(t, order.tableId)
              ? { ...t, status: 'cleaning', badge: 'Dirty' }
              : t
          ));
        }
      }
    });

    const unsubscribeTableStatus = orderEventManager.on('table:status', ({ tableId, newStatus, tableData }) => {
      console.log('[ToastTables] Table status changed:', tableId, newStatus);
      setFloorTables(prev => prev.map(t => 
        t.id === tableId || matchTableCanonical(t, tableId)
          ? { ...t, status: newStatus, ...tableData }
          : t
      ));
    });

    const unsubscribeTableOrder = orderEventManager.on('table:order', ({ tableId, orderData }) => {
      console.log('[ToastTables] Table order updated:', tableId);
      setTableBills(prev => ({
        ...prev,
        [tableId]: orderData
      }));
    });

    // Cleanup on unmount
    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribeOrderFired();
      unsubscribeOrderCompleted();
      unsubscribeOrderPaid();
      unsubscribeTableStatus();
      unsubscribeTableOrder();
    };
  }, []);

  const selectedTable = useMemo(() => {
    return floorTables.find(t => t.id === selectedTableId) || floorTables[0];
  }, [floorTables, selectedTableId]);

  // Sync activeChequeId whenever selectedTableId changes to prevent cross-table cheque collisions
  useEffect(() => {
    const cheques = tableBills[selectedTableId]?.cheques;
    if (cheques && cheques.length > 0) {
      if (!cheques.some(c => c.id === activeChequeId)) {
        setActiveChequeId(cheques[0].id);
      }
    } else {
      setActiveChequeId('');
    }
  }, [selectedTableId, tableBills]);

  const activeBill = useMemo(() => {
    const tableCheques = tableBills[selectedTableId]?.cheques;
    if (!tableCheques || tableCheques.length === 0) return { items: [], discount: 0 };
    return tableCheques.find(c => c.id === activeChequeId) || tableCheques[0] || { items: [], discount: 0 };
  }, [tableBills, selectedTableId, activeChequeId]);

  const seatingStage = useMemo(() => {
    return getTableSeatingStage(selectedTable);
  }, [selectedTable, nowTick]);

  const sortedBillItems = useMemo(() => {
    if (!activeBill.items || activeBill.items.length === 0) return [];
    const filtered = activeBill.items.filter(item => selectedSeatId === 'All' || item.seat?.toString() === selectedSeatId.toString());
    if (!itemSortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let va, vb;
      if (itemSortKey === 'qty') { va = a.qty || 0; vb = b.qty || 0; }
      if (itemSortKey === 'price') { va = (a.price || 0) * (a.qty || 1); vb = (b.price || 0) * (b.qty || 1); }
      if (itemSortKey === 'article') { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); }
      if (itemSortKey === 'article') return itemSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return itemSortDir === 'asc' ? va - vb : vb - va;
    });
  }, [activeBill.items, selectedSeatId, itemSortKey, itemSortDir]);

  const subtotal = useMemo(() => {
    if (!activeBill.items || activeBill.items.length === 0) return 0;
    const filtered = selectedSeatId === 'All' ? activeBill.items : activeBill.items.filter(i => i.seat?.toString() === selectedSeatId.toString());
    return filtered.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [activeBill.items, selectedSeatId]);

  const entireChequeSubtotal = useMemo(() => {
    if (!activeBill.items || activeBill.items.length === 0) return 0;
    return activeBill.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [activeBill.items]);

  const allocatedDiscount = useMemo(() => {
    if (!activeBill.discount || entireChequeSubtotal === 0) return 0;
    if (selectedSeatId === 'All') return activeBill.discount;
    // Proportional discount allocation per seat
    return (subtotal / entireChequeSubtotal) * activeBill.discount;
  }, [activeBill.discount, subtotal, entireChequeSubtotal, selectedSeatId]);

  const gstRatePct = settings && settings.gstRate !== undefined ? settings.gstRate : 5;
  const serviceChargeRatePct = settings && settings.serviceChargeRate !== undefined ? settings.serviceChargeRate : 2.5;

  const netSubtotal = useMemo(() => {
    return Math.max(0, subtotal - allocatedDiscount);
  }, [subtotal, allocatedDiscount]);

  const taxAmount = useMemo(() => {
    return (netSubtotal * gstRatePct) / 100;
  }, [netSubtotal, gstRatePct]);

  const serviceChargeAmount = useMemo(() => {
    return (netSubtotal * serviceChargeRatePct) / 100;
  }, [netSubtotal, serviceChargeRatePct]);

  const total = useMemo(() => {
    return netSubtotal + taxAmount + serviceChargeAmount;
  }, [netSubtotal, taxAmount, serviceChargeAmount]);

  const calculateTotal = useCallback(() => total, [total]);

  // Operational Handlers with Confirmations & Toast Feedback
  const handleOpenTable = () => {
    if (selectedTable.status === 'out_of_service' || selectedTable.badge === 'Out of Service') {
      showToast(`Table #${selectedTable.name} is currently unavailable for seating`, 'error');
      return;
    }

    if (selectedTable.badge === 'Dirty') {
      askConfirmation(
        `Seat Dirty Table #${selectedTable.name}?`,
        `Table #${selectedTable.name} is currently flagged as Dirty and requires bussing/sanitizing. Do you still want to seat guests?`,
        () => proceedSeatingTable()
      );
      return;
    }

    proceedSeatingTable();
  };

  const proceedSeatingTable = () => {
    setFloorTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, status: 'occupied', guests: t.guests || 2, seatedAt: Date.now(), badge: t.badge === 'Dirty' || t.badge === 'Sanitizing' ? undefined : t.badge } : t));

    if (!tableBills[selectedTableId] || !tableBills[selectedTableId].cheques || tableBills[selectedTableId].cheques.length === 0) {
      const newChequeId = generateChequeId();
      setTableBills(prev => ({
        ...prev,
        [selectedTableId]: { cheques: [{ id: newChequeId, items: [], discount: 0 }] }
      }));
      setActiveChequeId(newChequeId);
    }

    if (setPropTables && propTables.length > 0) {
      setPropTables(prev => prev.map(t => matchTableCanonical(selectedTable, t.number) || matchTableCanonical(selectedTable, t.id) ? { ...t, status: 'occupied' } : t));
    }

    addLog(selectedTableId, `Table #${selectedTable.name} seated`);
    showToast(`Table #${selectedTable.name} opened`, 'success');
    
    // Emit table status change event
    orderEventManager.emitTableStatusChanged(selectedTableId, 'occupied', {
      guests: selectedTable.guests || 2,
      seatedAt: Date.now()
    });
  };

  const handleClearTable = () => {
    askConfirmation(
      `Clear Table #${selectedTable.name}?`,
      `This will clear all open cheques and reset Table #${selectedTable.name} to available status. Are you sure?`,
      () => {
        setFloorTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, status: 'available', guests: undefined, badge: undefined, seatedAt: undefined } : t));
        setTableBills(prev => ({ ...prev, [selectedTableId]: { cheques: [] } }));
        
        if (setPropTables && propTables.length > 0) {
          setPropTables(prev => prev.map(t => matchTableCanonical(selectedTable, t.number) || matchTableCanonical(selectedTable, t.id) ? { ...t, status: 'available' } : t));
        }

        addLog(selectedTableId, `Table #${selectedTable.name} cleared`);
        showToast(`Table #${selectedTable.name} cleared`, 'info');
        setShowMenuModal(false);
      }
    );
  };

  // Feature 5: Course Firing Control & Timed Hold Handler
  const handleFireCourse = (courseName, delayMinutes = 0) => {
    try {
      const kotManager = getKOTManager();
      if (delayMinutes > 0) {
        setTimeout(() => {
          kotManager.createKOT({
            orderId: `HOLD-${Date.now()}`,
            tableNumber: selectedTable.name,
            items: activeBill.items || [],
            notes: `⏱️ DEFERRED FIRE (${delayMinutes}m Hold): ${courseName}`,
            createdAt: new Date().toISOString()
          });
        }, delayMinutes * 60 * 1000);
        addLog(selectedTableId, `⏱️ Prep Hold set for ${delayMinutes} minutes on ${courseName}`);
        showToast(`⏱️ ${delayMinutes}m prep hold set for ${courseName}`, 'warning');
        setShowTimedHoldModal(false);
      } else {
        kotManager.createKOT({
          orderId: `FIRE-${Date.now()}`,
          tableNumber: selectedTable.name,
          items: activeBill.items || [],
          notes: `🔥 FIRE COURSE: ${courseName}`,
          createdAt: new Date().toISOString()
        });
        addLog(selectedTableId, `🔥 Course Signal Sent to Kitchen: ${courseName}`);
        showToast(`🔥 ${courseName} fired to kitchen!`, 'success');
      }
    } catch (e) {
      console.log('KOT course fire notification sent');
      showToast(`🔥 ${courseName} course signal sent`, 'success');
    }
  };

  // Table Transfer / Move Party Handler
  const handleTransferTable = () => {
    if (!transferTargetTableId) {
      showToast('Please select which table to transfer the order to', 'warning');
      return;
    }
    const targetTable = floorTables.find(t => matchTableCanonical(t, transferTargetTableId));
    if (!targetTable) {
      showToast('Unable to find the selected destination table', 'error');
      return;
    }

    // Transfer bills, seating timer, and customers
    setTableBills(prev => {
      const sourceBills = prev[selectedTableId] || { cheques: [] };
      const targetBills = prev[targetTable.id] || { cheques: [] };
      return {
        ...prev,
        [selectedTableId]: { cheques: [] },
        [targetTable.id]: { cheques: [...targetBills.cheques, ...sourceBills.cheques] }
      };
    });

    setFloorTables(prev => prev.map(t => {
      if (t.id === selectedTableId) {
        return { ...t, status: 'available', guests: undefined, seatedAt: undefined };
      }
      if (t.id === targetTable.id) {
        return { ...t, status: 'occupied', guests: selectedTable.guests || 2, seatedAt: selectedTable.seatedAt || Date.now() };
      }
      return t;
    }));

    addLog(selectedTableId, `Transferred Table #${selectedTable.name} to Table #${targetTable.name}`);
    addLog(targetTable.id, `Received party transfer from Table #${selectedTable.name}`);
    showToast(`Transferred Table #${selectedTable.name} to #${targetTable.name}`, 'success');
    setSelectedTableId(targetTable.id);
    setShowTransferModal(false);
  };

  // Feature 1: Floor Plan Editor Handlers
  const handleSaveFloorplan = () => {
    try {
      localStorage.setItem('toast_tables_floorplan', JSON.stringify(floorTables));
      setIsEditMode(false);
      addLog(selectedTableId, `Custom Floor Plan Layout Saved`);
      showToast('Floor plan layout saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save floor plan to localStorage:', err);
      showToast('Unable to save floor plan changes. Please check your browser storage settings.', 'error');
      setIsEditMode(false);
    }
  };

  const handleAddTableElement = () => {
    const trimmedName = newElementData.name ? newElementData.name.trim() : '';
    if (!trimmedName) {
      showToast('Table/Wall name is required', 'warning');
      return;
    }

    // Uniqueness validation check
    const isDuplicate = floorTables.some(t => t.name?.toLowerCase() === trimmedName.toLowerCase() || t.number?.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      showToast(`A table or element named "${trimmedName}" already exists! Please choose a unique name.`, 'error');
      return;
    }

    const newId = Date.now();
    // Offset positioning to prevent stacking directly on top of each other
    const existingCount = floorTables.length;
    const offsetX = 15 + ((existingCount * 8) % 65);
    const offsetY = 15 + ((existingCount * 6) % 55);

    const newEl = {
      id: newId,
      number: trimmedName,
      name: trimmedName,
      shape: newElementData.shape || 'rect',
      type: newElementData.type || 'table',
      x: offsetX,
      y: offsetY,
      wPct: newElementData.type === 'wall' ? 18 : 10,
      hPct: newElementData.type === 'wall' ? 4 : 12,
      status: 'available',
      section: selectedSection === 'All Sections' ? 'Main' : selectedSection
    };

    setFloorTables(prev => [...prev, newEl]);
    showToast(`Added ${newElementData.type} "${trimmedName}"`, 'success');
    setShowAddTableModal(false);
    setNewElementData({ name: '', shape: 'rect', type: 'table' });
  };

  const handleDuplicateElement = (targetId) => {
    const original = floorTables.find(t => t.id === targetId);
    if (!original) return;

    const baseName = original.name || 'Table';
    let dupName = `${baseName}-Copy`;
    let counter = 1;
    while (floorTables.some(t => t.name === dupName || t.number === dupName)) {
      dupName = `${baseName}-Copy${counter}`;
      counter++;
    }

    const dupEl = {
      ...original,
      id: Date.now(),
      name: dupName,
      number: dupName,
      x: Math.min(85, original.x + 4),
      y: Math.min(85, original.y + 4),
      status: 'available',
      seatedAt: undefined,
      guests: undefined,
      badge: undefined
    };

    setFloorTables(prev => [...prev, dupEl]);
    showToast(`Duplicated "${original.name}" as "${dupName}"`, 'success');
  };

  const handleTableMouseDown = (e, tableId) => {
    if (!isEditMode) return;
    setDraggedElement(tableId);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isEditMode || !draggedElement || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const xPct = Math.max(2, Math.min(88, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(88, ((clientY - rect.top) / rect.height) * 100));

    setFloorTables(prev => prev.map(t => t.id === draggedElement ? { ...t, x: Math.round(xPct), y: Math.round(yPct) } : t));
  };

  const handleCanvasMouseUp = () => {
    setDraggedElement(null);
  };

  // Feature 3: Functional Table Merging Handler (combines bills & visual link)
  const handleMergeTables = () => {
    if (!targetMergeTableId) {
      showToast('Please select which table to merge with', 'warning');
      return;
    }
    const targetTable = floorTables.find(t => matchTableCanonical(t, targetMergeTableId));
    if (!targetTable) {
      showToast('Unable to find the selected table for merging', 'error');
      return;
    }

    // Actual bill merging: append cheques of target table into selected table
    setTableBills(prev => {
      const sourceCheques = prev[selectedTableId]?.cheques || [];
      const targetCheques = prev[targetTable.id]?.cheques || [];
      return {
        ...prev,
        [selectedTableId]: { cheques: [...sourceCheques, ...targetCheques] },
        [targetTable.id]: { cheques: [] }
      };
    });

    setTableMerges(prev => [...prev, { table1: selectedTableId, table2: targetTable.id }]);
    addLog(selectedTableId, `Merged Table #${selectedTable.name} with Table #${targetTable.name} (Bills Combined)`);
    showToast(`Merged Table #${selectedTable.name} & #${targetTable.name} — Bills combined`, 'success');
    setShowMergeModal(false);
  };

  // Functional N-Way Bill Splitter (creates N actual split cheques)
  const handleConfirmNWaySplit = () => {
    if (!activeBill.items || activeBill.items.length === 0) {
      showToast('No items on active cheque to split', 'warning');
      return;
    }
    if (nWaySplitCount < 2) return;

    const totalAmt = calculateTotal();
    const splitCheques = [];

    // Distribute items or create N fractional cheques
    const numItems = activeBill.items.length;
    for (let k = 0; k < nWaySplitCount; k++) {
      const chequeId = generateChequeId();
      // Evenly distribute items or assign pro-rata items
      const itemsForCheque = activeBill.items.filter((_, idx) => idx % nWaySplitCount === k);
      splitCheques.push({
        id: chequeId,
        items: itemsForCheque.length > 0 ? itemsForCheque : activeBill.items.map(i => ({ ...i, price: (i.price / nWaySplitCount) })),
        discount: (activeBill.discount || 0) / nWaySplitCount,
        notes: `🧮 ${k + 1} of ${nWaySplitCount} Equal N-Way Split Payment (Target: ₹${(totalAmt / nWaySplitCount).toFixed(2)})`
      });
    }

    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const remaining = existing.filter(c => c.id !== activeChequeId);
      return {
        ...prev,
        [selectedTableId]: { cheques: [...remaining, ...splitCheques] }
      };
    });

    if (splitCheques.length > 0) setActiveChequeId(splitCheques[0].id);
    addLog(selectedTableId, `Split cheque into ${nWaySplitCount} separate cheques of ₹${(totalAmt / nWaySplitCount).toFixed(2)} each`);
    showToast(`Cheque split into ${nWaySplitCount} equal cheques`, 'success');
    setShowNWaySplitModal(false);
  };

  // Functional Item-Specific Split Cheque Handler
  const handleConfirmItemSplit = () => {
    if (!activeBill.items || activeBill.items.length === 0) return;
    if (selectedSplitItemIds.length === 0) {
      showToast('Please select at least one item to split off', 'warning');
      return;
    }

    const itemsToMove = activeBill.items.filter(i => selectedSplitItemIds.includes(i.id));
    const itemsToKeep = activeBill.items.filter(i => !selectedSplitItemIds.includes(i.id));

    if (itemsToKeep.length === 0) {
      showToast('Cannot split all items off — active cheque would be empty', 'warning');
      return;
    }

    const newChequeId = generateChequeId();
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const updatedExisting = existing.map(c => c.id === activeChequeId ? { ...c, items: itemsToKeep } : c);
      return {
        ...prev,
        [selectedTableId]: { cheques: [...updatedExisting, { id: newChequeId, items: itemsToMove, discount: 0 }] }
      };
    });

    addLog(selectedTableId, `Split ${itemsToMove.length} item(s) to new cheque ${newChequeId}`);
    showToast(`Split ${itemsToMove.length} item(s) to ${newChequeId}`, 'success');
    setSelectedSplitItemIds([]);
    setShowSplitModal(false);
  };

  // Feature 6: Customer / Reservation Pairing Handler
  const handlePairCustomer = (cust) => {
    setTableCustomers(prev => ({
      ...prev,
      [selectedTableId]: { name: cust.name, phone: cust.phone || '', points: cust.points || 50 }
    }));
    addLog(selectedTableId, `Linked customer ${cust.name} to Table #${selectedTable.name}`);
    setShowCustomerPairModal(false);
  };

  const handleSendMessage = () => {
    if (!kitchenMessage.trim()) return;
    try {
      const kotManager = getKOTManager();
      kotManager.createKOT({
        orderId: `MSG-${Date.now()}`,
        tableNumber: selectedTable.name,
        items: [],
        notes: kitchenMessage,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.log('KOT note created');
    }
    addLog(selectedTableId, `Kitchen message sent: "${kitchenMessage}"`);
    setKitchenMessage('');
    setShowMessageModal(false);
  };

  const handleRenameTable = () => {
    if (!newTableName.trim()) return;
    setFloorTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, name: newTableName } : t));
    addLog(selectedTableId, `Table renamed to ${newTableName}`);
    setShowRenameModal(false);
  };

  const handleSaveNote = () => {
    addLog(selectedTableId, `Table note added: "${tableNote}"`);
    setShowNoteModal(false);
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountAmountInput) || 0;
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const updated = existing.map(c => c.id === activeChequeId ? { ...c, discount: val } : c);
      return { ...prev, [selectedTableId]: { cheques: updated } };
    });
    addLog(selectedTableId, `Discount of ₹${val.toFixed(2)} applied to cheque ${activeChequeId}`);
    setShowDiscountModal(false);
    setDiscountAmountInput('');
  };

  const handleSplitCheque = () => {
    if (!activeBill.items || activeBill.items.length < 2) return;
    const splitItem = activeBill.items[activeBill.items.length - 1];
    const newChequeId = generateChequeId();
    
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const updatedActive = existing.map(c => c.id === activeChequeId ? { ...c, items: c.items.filter(i => i.id !== splitItem.id) } : c);
      return {
        ...prev,
        [selectedTableId]: {
          cheques: [...updatedActive, { id: newChequeId, items: [splitItem], discount: 0 }]
        }
      };
    });

    addLog(selectedTableId, `Split item "${splitItem.name}" to new cheque ${newChequeId}`);
    setShowSplitModal(false);
  };

  const handleAddItemToBill = (item) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: item.name,
      qty: 1,
      price: item.price,
      seat: selectedSeatId === 'All' ? 1 : parseInt(selectedSeatId),
      currency: '₹'
    };

    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const chequeMatch = existing.find(c => c.id === activeChequeId) || existing[0];
      if (chequeMatch) {
        const updated = existing.map(c => c.id === chequeMatch.id ? { ...c, items: [...c.items, newItem] } : c);
        return { ...prev, [selectedTableId]: { cheques: updated } };
      } else {
        const newChequeId = generateChequeId();
        return { ...prev, [selectedTableId]: { cheques: [{ id: newChequeId, items: [newItem], discount: 0 }] } };
      }
    });

    if (selectedTable.status !== 'occupied') {
      handleOpenTable();
    }

    addLog(selectedTableId, `Added "${item.name}" (₹${item.price.toFixed(2)}) for Seat ${newItem.seat}`);
    setShowAddItemModal(false);
  };

  // Distinction: Remove unsent item vs Void fired/sent item
  const handleItemDeleteClick = (item) => {
    if (item.tag || item.isFired) {
      // Fired/sent item: Requires Manager Void with Reason and PIN
      setItemToVoid(item);
      setVoidReason('Customer changed mind');
      setManagerPin('');
      setShowVoidModal(true);
    } else {
      // Unsent item: Direct remove
      handleRemoveItemFromBill(item.id);
    }
  };

  const handleConfirmVoidItem = () => {
    if (!itemToVoid) return;
    if (managerPin !== '1234' && managerPin !== '0000' && managerPin !== '') {
      showToast('Invalid Manager PIN (Default: 1234)', 'error');
      return;
    }

    let voidedName = itemToVoid.name;
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const chequeMatch = existing.find(c => c.id === activeChequeId) || existing[0];
      if (!chequeMatch) return prev;

      const updatedItems = chequeMatch.items.filter(i => i.id !== itemToVoid.id);
      const updatedCheques = existing.map(c => c.id === chequeMatch.id ? { ...c, items: updatedItems } : c);
      return { ...prev, [selectedTableId]: { cheques: updatedCheques } };
    });

    addLog(selectedTableId, `⛔ MANAGER VOID: "${voidedName}" (Reason: ${voidReason})`);
    showToast(`Voided "${voidedName}" — Logged in audit trail`, 'warning');
    setShowVoidModal(false);
    setItemToVoid(null);
  };

  const handleRemoveItemFromBill = (itemId) => {
    let removedItemName = '';
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      const chequeMatch = existing.find(c => c.id === activeChequeId) || existing[0];
      if (!chequeMatch) return prev;

      const updatedItems = chequeMatch.items.reduce((acc, item) => {
        if (item.id === itemId) {
          removedItemName = item.name;
          if (item.qty > 1) {
            acc.push({ ...item, qty: item.qty - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, []);

      const updatedCheques = existing.map(c => c.id === chequeMatch.id ? { ...c, items: updatedItems } : c);
      return { ...prev, [selectedTableId]: { cheques: updatedCheques } };
    });

    if (removedItemName) {
      addLog(selectedTableId, `Removed unsent item "${removedItemName}" from cheque ${activeChequeId}`);
    }
  };

  const handleUpdateGuestsCount = (newCount) => {
    const parsed = Math.max(1, parseInt(newCount) || 1);
    setFloorTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, guests: parsed } : t));
    addLog(selectedTableId, `Guest count updated to ${parsed} guests`);
    showToast(`Updated Table #${selectedTable.name} to ${parsed} guests`, 'success');
    setShowGuestsModal(false);
  };

  // Quick POS Register Modal Actions
  const addToQuickPOSCart = (item) => {
    setQuickPOSCart(prev => {
      const match = prev.find(i => i.id === item.id && i.seat === quickPOSSelectedSeat);
      if (match) {
        return prev.map(i => (i.id === item.id && i.seat === quickPOSSelectedSeat) ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, seat: quickPOSSelectedSeat }];
    });
  };

  const submitQuickPOSOrder = () => {
    if (quickPOSCart.length === 0) return;
    
    // Create order using workflow service
    const orderData = {
      id: `ORD-${Date.now()}`,
      tableId: selectedTableId,
      tableNumber: selectedTable.name,
      items: quickPOSCart.map(i => ({ ...i, seat: i.seat || quickPOSSelectedSeat })),
      specialRequest: quickPOSOrderNote,
      waiterId: staff && staff.length > 0 ? staff[0].id : null,
      orderType: 'dine_in'
    };

    const order = orderWorkflowService.createOrder(orderData);
    
    // Add items to bill
    quickPOSCart.forEach(item => {
      for (let k = 0; k < item.qty; k++) {
        handleAddItemToBill({ ...item, seat: item.seat || quickPOSSelectedSeat });
      }
    });

    // Fire order to kitchen
    const kot = orderWorkflowService.fireOrderToKitchen(
      order,
      quickPOSCart.map(i => ({ ...i, seat: i.seat || quickPOSSelectedSeat })),
      selectedTableId,
      staff && staff.length > 0 ? staff[0].id : null
    );

    // Generate token if configured
    if (settings?.enableTokens) {
      orderWorkflowService.generateToken(order.id);
    }

    // Update table order data
    orderWorkflowService.updateTableOrder(selectedTableId, tableBills[selectedTableId]);

    try {
      const kotManager = getKOTManager();
      kotManager.createKOT({
        orderId: order.id,
        tableNumber: selectedTable.name,
        items: quickPOSCart.map(i => ({ name: i.name, quantity: i.qty, price: i.price, seat: i.seat })),
        notes: quickPOSOrderNote ? `Quick POS: ${quickPOSOrderNote}` : 'Quick POS order from Toast Tables',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.log('KOT created from Quick POS');
    }

    addLog(selectedTableId, `Quick POS order ${order.id} placed with ${quickPOSCart.length} items for Seat ${quickPOSSelectedSeat}`);
    setQuickPOSCart([]);
    setQuickPOSOrderNote('');
    setShowQuickPOSModal(false);
    showToast(`Order ${order.id} sent to kitchen`, 'success');
  };

  const handlePay = () => {
    if (!activeBill || !activeBill.items || activeBill.items.length === 0) return;
    setPaymentAmount(calculateTotal().toFixed(2));
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (paymentDetails) => {
    const totalAmount = calculateTotal();
    const newOrder = {
      id: `ORD-${Date.now()}`,
      tableNumber: selectedTable.name,
      items: activeBill.items,
      total: totalAmount,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    setOrders && setOrders([...orders, newOrder]);
    setCompletedOrder(newOrder);

    addLog(selectedTableId, `Payment of ₹${totalAmount.toFixed(2)} completed for cheque ${activeChequeId}`);

    setFloorTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, status: 'available', guests: undefined, badge: undefined, seatedAt: undefined } : t));
    
    setTableBills(prev => ({
      ...prev,
      [selectedTableId]: { cheques: [] }
    }));

    setShowPaymentModal(false);
    setShowReceiptModal(true);
  };

  const handleAddCheque = () => {
    const newChequeId = generateChequeId();
    setTableBills(prev => {
      const existing = prev[selectedTableId]?.cheques || [];
      return {
        ...prev,
        [selectedTableId]: {
          cheques: [...existing, { id: newChequeId, items: [], discount: 0 }]
        }
      };
    });
    setActiveChequeId(newChequeId);
    addLog(selectedTableId, `Created new cheque ${newChequeId}`);
  };

  const sections = ['All Sections', 'Main', 'Outside', 'The Bar', 'Open'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      width: '100%',
      backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc',
      color: darkMode ? '#f1f5f9' : '#1e293b',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden',
      userSelect: 'none',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      {/* ── Mobile Panel Selector Switcher ── */}
      {isMobile && (
        <div style={{
          display: 'flex',
          backgroundColor: darkMode ? '#1a1a1a' : '#f1f5f9',
          borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
          padding: '4px',
          flexShrink: 0
        }}>
          <button
            onClick={() => setMobilePanel('floor')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: mobilePanel === 'floor' ? '#6366f1' : 'transparent',
              color: mobilePanel === 'floor' ? '#ffffff' : (darkMode ? '#cbd5e1' : '#64748b'),
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🗺️ Floor Plan
          </button>
          <button
            onClick={() => setMobilePanel('bill')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: mobilePanel === 'bill' ? '#6366f1' : 'transparent',
              color: mobilePanel === 'bill' ? '#ffffff' : (darkMode ? '#cbd5e1' : '#64748b'),
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🧾 Bill #{selectedTable.name}
          </button>
          <button
            onClick={() => setMobilePanel('sections')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: mobilePanel === 'sections' ? '#6366f1' : 'transparent',
              color: mobilePanel === 'sections' ? '#ffffff' : (darkMode ? '#cbd5e1' : '#64748b'),
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📁 Sections
          </button>
        </div>
      )}

      {/* ── Main Body Split Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
        
        {/* ── Left Sidebar: Floor Sections & Layout Mode Toggle ── */}
        {(!isMobile || mobilePanel === 'sections') && (
          <div style={{
            width: isMobile ? '100%' : isTablet ? '100px' : '140px',
            backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc',
            borderRight: darkMode ? '2px solid #334155' : '2px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              {/* Floor Plan Quick Search */}
              <div style={{ padding: '8px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1' }}>
                <input
                  type="text"
                  placeholder="🔍 Search table..."
                  value={floorSearchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setFloorSearchQuery(q);
                    if (q.trim()) {
                      const match = floorTables.find(t => matchTableCanonical(t, q.trim()));
                      if (match) {
                        setSelectedTableId(match.id);
                        if (match.section) setSelectedSection(match.section);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: darkMode ? '#2a2a2a' : '#f1f5f9',
                    border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    color: darkMode ? '#f1f5f9' : '#1e293b',
                    fontSize: '11px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {sections.map(sec => {
                const isActive = selectedSection === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => {
                      setSelectedSection(sec);
                      if (isMobile) setMobilePanel('floor');
                    }}
                    style={{
                      flex: isMobile ? '1 1 45%' : 'none',
                      padding: isTablet ? '12px 6px' : '14px 10px',
                      textAlign: isMobile ? 'center' : 'left',
                      backgroundColor: isActive ? (darkMode ? '#1a1a1a' : '#e2e8f0') : 'transparent',
                      color: isActive ? (darkMode ? '#f1f5f9' : '#1e293b') : (darkMode ? '#94a3b8' : '#64748b'),
                      border: 'none',
                      borderLeft: !isMobile && isActive ? '4px solid #f59e0b' : '4px solid transparent',
                      borderBottom: isMobile && isActive ? '3px solid #f59e0b' : 'none',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: isTablet ? '11px' : '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>

            {/* Layout Editor Mode Toggle + Quick POS */}
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => isEditMode ? handleSaveFloorplan() : setIsEditMode(true)}
                title={isEditMode ? "Save Custom Floor Plan" : "Edit Floor Plan Layout"}
                style={{
                  width: '100%',
                  padding: '10px 6px',
                  backgroundColor: isEditMode ? '#6366f1' : (darkMode ? '#1a1a1a' : '#e2e8f0'),
                  color: isEditMode ? '#ffffff' : (darkMode ? '#f1f5f9' : '#1e293b'),
                  border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {isEditMode ? '💾 Save Layout' : '✏️ Edit Layout'}
              </button>

              <button
                onClick={() => setShowQuickPOSModal(true)}
                title="Open Quick POS Register"
                style={{
                  width: '100%',
                  padding: '10px 6px',
                  backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
                  color: darkMode ? '#f1f5f9' : '#1e293b',
                  border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⇄</span> POS
              </button>
            </div>
          </div>
        )}

        {/* ── Center Area: Floor Plan Canvas ── */}
        {(!isMobile || mobilePanel === 'floor') && (
          <div 
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onTouchMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onTouchEnd={handleCanvasMouseUp}
            style={{
              flex: 1,
              backgroundColor: isEditMode ? (darkMode ? '#1a1a1a' : '#f1f5f9') : (darkMode ? '#0f0f0f' : '#f8fafc'),
              backgroundImage: isEditMode ? `radial-gradient(${darkMode ? '#334155' : '#cbd5e1'} 1px, transparent 1px)` : 'none',
              backgroundSize: '20px 20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
              height: '100%'
            }}
          >
            {/* Top Toolbar in Edit Mode */}
            {isEditMode && (
              <div style={{
                padding: '8px 14px',
                backgroundColor: darkMode ? '#1a1a1a' : '#f1f5f9',
                borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 20
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: theme.warning }}>
                  ✏️ FLOOR BUILDER MODE: Drag tables to position
                </span>
                <button
                  onClick={() => setShowAddTableModal(true)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: theme.accent,
                    color: theme.text,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  + Add Table / Wall
                </button>
              </div>
            )}

            {/* Feature 3: Visual SVG Merged Tables Connecting Lines */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
              {tableMerges.map((m, idx) => {
                const t1 = floorTables.find(t => t.id === m.table1 || t.number === m.table1.toString());
                const t2 = floorTables.find(t => t.id === m.table2 || t.number === m.table2.toString());
                if (!t1 || !t2) return null;
                return (
                  <g key={`merge-${idx}`}>
                    <line
                      x1={`${t1.x + 5}%`}
                      y1={`${t1.y + 6}%`}
                      x2={`${t2.x + 5}%`}
                      y2={`${t2.y + 6}%`}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                    />
                    <circle cx={`${(t1.x + t2.x) / 2 + 5}%`} cy={`${(t1.y + t2.y) / 2 + 6}%`} r="10" fill="#f59e0b" />
                    <text x={`${(t1.x + t2.x) / 2 + 5}%`} y={`${(t1.y + t2.y) / 2 + 6.5}%`} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">🔗</text>
                  </g>
                );
              })}
            </svg>

            {/* Tables Map Canvas fitted strictly inside viewport height */}
            <div style={{
              position: 'relative',
              flex: 1,
              padding: '12px',
              overflow: 'hidden',
              height: '100%'
            }}>
              {floorTables
                .filter(t => selectedSection === 'All Sections' || !t.section || t.section === selectedSection)
                .filter(t => !floorSearchQuery.trim() || t.name?.toLowerCase().includes(floorSearchQuery.toLowerCase()) || t.number?.toString().toLowerCase().includes(floorSearchQuery.toLowerCase()))
                .map(t => {
                const isSelected = selectedTableId === t.id;
                const isOccupied = t.status === 'occupied';
                const isCleaning = t.status === 'cleaning';
                const seatingInfo = getTableSeatingStage(t);

                if (t.type === 'wall') {
                  return (
                    <div
                      key={t.id}
                      onMouseDown={(e) => handleTableMouseDown(e, t.id)}
                      onTouchStart={(e) => handleTableMouseDown(e, t.id)}
                      style={{
                        position: 'absolute',
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        width: `clamp(60px, ${t.wPct}vw, 160px)`,
                        height: `clamp(10px, ${t.hPct}vh, 25px)`,
                        backgroundColor: darkMode ? '#475569' : '#94a3b8',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: darkMode ? '#f1f5f9' : '#ffffff',
                        fontWeight: '700',
                        cursor: isEditMode ? 'move' : 'default',
                        border: isEditMode ? '2px dashed #f59e0b' : darkMode ? '1px solid #64748b' : '1px solid #cbd5e1',
                        boxShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      🧱 WALL
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    onMouseDown={(e) => handleTableMouseDown(e, t.id)}
                    onTouchStart={(e) => handleTableMouseDown(e, t.id)}
                    onClick={() => {
                      if (isEditMode) return;
                      setSelectedTableId(t.id);
                      if (t.chequeId) setActiveChequeId(t.chequeId);
                      if (isMobile) setMobilePanel('bill');
                    }}
                    style={{
                      position: 'absolute',
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      width: `clamp(40px, ${t.wPct}vw, 95px)`,
                      height: `clamp(36px, ${t.hPct}vh, 65px)`,
                      borderRadius: t.shape === 'circle' ? '50%' : '8px',
                      backgroundColor: t.status === 'cleaning' 
                        ? (darkMode ? '#164e63' : '#cffafe') 
                        : isOccupied 
                        ? (darkMode ? '#1e293b' : '#e2e8f0') 
                        : (darkMode ? '#1a1a1a' : '#ffffff'),
                      color: t.status === 'cleaning' 
                        ? (darkMode ? '#cffafe' : '#0e7490') 
                        : isOccupied 
                        ? (darkMode ? '#f1f5f9' : '#1e293b') 
                        : (darkMode ? '#94a3b8' : '#64748b'),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: 'clamp(11px, 1.2vw, 16px)',
                      cursor: isEditMode ? 'move' : 'pointer',
                      boxShadow: isSelected 
                        ? (darkMode ? '0 0 0 3px #6366f1' : '0 0 0 3px #6366f1') 
                        : t.status === 'cleaning'
                        ? (darkMode ? '0 0 0 2px #06b6d4' : '0 0 0 2px #06b6d4')
                        : (darkMode ? '0 4px 6px rgba(0,0,0,0.4)' : '0 4px 6px rgba(0,0,0,0.1)'),
                      border: t.status === 'cleaning'
                        ? (darkMode ? '2px dashed #06b6d4' : '2px dashed #06b6d4')
                        : isOccupied 
                        ? (darkMode ? '2px solid #6366f1' : '2px solid #6366f1') 
                        : (darkMode ? '1px solid #334155' : '1px solid #cbd5e1'),
                      transition: isEditMode ? 'none' : 'all 0.15s ease',
                      zIndex: isSelected ? 10 : 3
                    }}
                  >
                    {isEditMode && (
                      <div
                        onClick={(e) => { e.stopPropagation(); handleDuplicateElement(t.id); }}
                        title="Duplicate element"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#6366f1',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                          zIndex: 15,
                          border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1'
                        }}
                      >
                        📋
                      </div>
                    )}

                    <span style={{
                      fontSize: 'clamp(12px, 1.3vw, 18px)',
                      fontWeight: '800',
                      color: isOccupied 
                        ? (darkMode ? '#f1f5f9' : '#1e293b') 
                        : (darkMode ? '#cbd5e1' : '#64748b'),
                      textShadow: isOccupied 
                        ? (darkMode ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.1)') 
                        : 'none',
                      letterSpacing: '0.5px'
                    }}>{t.name}</span>
                    
                    {/* Status Text */}
                    <span style={{
                      fontSize: 'clamp(8px, 0.8vw, 10px)',
                      fontWeight: '600',
                      color: t.status === 'cleaning' 
                        ? '#06b6d4' 
                        : isOccupied 
                        ? (seatingInfo.stage === 'fresh' ? '#10b981' : seatingInfo.stage === 'warning' ? '#f59e0b' : seatingInfo.stage === 'overdue' ? '#ef4444' : '#64748b')
                        : (darkMode ? '#64748b' : '#94a3b8'),
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginTop: '2px'
                    }}>
                      {t.status === 'cleaning' 
                        ? '🧹 Cleaning' 
                        : isOccupied 
                        ? (seatingInfo.stage === 'fresh' ? 'Active' : seatingInfo.stage === 'warning' ? 'Waiting' : seatingInfo.stage === 'overdue' ? 'Overdue' : 'Seated') 
                        : 'Available'}
                    </span>

                    {/* Feature 2: Seating Duration Timer Badge (Top Left) */}
                    {isCleaning && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '-6px',
                        backgroundColor: '#06b6d4',
                        color: '#ffffff',
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                        animation: 'pulse 2s infinite'
                      }}>
                        🧹 Cleaning
                      </div>
                    )}
                    {isOccupied && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '-6px',
                        backgroundColor: seatingInfo.stage === 'fresh' ? '#10b981' : seatingInfo.stage === 'warning' ? '#f59e0b' : seatingInfo.stage === 'overdue' ? '#ef4444' : '#64748b',
                        color: '#ffffff',
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1'
                      }}>
                        ⏱️ {seatingInfo.label}
                      </div>
                    )}

                    {/* Guest Count Badge (Top Right) */}
                    {isOccupied && t.guests && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: 'clamp(16px, 1.5vw, 22px)',
                        height: 'clamp(16px, 1.5vw, 22px)',
                        borderRadius: '50%',
                        backgroundColor: darkMode ? '#f59e0b' : '#f59e0b',
                        color: '#ffffff',
                        fontSize: 'clamp(8px, 0.9vw, 11px)',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: darkMode ? '2px solid #475569' : '2px solid #cbd5e1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {t.guests}
                      </div>
                    )}

                    {/* Tag / Badges List */}
                    {(t.badges?.length > 0 || t.badge) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-9px',
                        display: 'flex',
                        gap: '2px',
                        zIndex: 12
                      }}>
                        {Array.from(new Set([...(t.badges || []), ...(t.badge ? [t.badge] : [])])).map((bdg, bIdx) => (
                          <span
                            key={bIdx}
                            style={{
                              backgroundColor: bdg === 'Dirty' ? '#ef4444' : bdg === 'Sanitizing' ? '#6366f1' : bdg === 'VIP' ? '#f59e0b' : bdg === 'Out of Service' ? '#64748b' : '#94a3b8',
                              color: '#ffffff',
                              fontSize: '8px',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                              whiteSpace: 'nowrap',
                              border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1'
                            }}
                          >
                            {bdg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Operational Action Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '8px',
              padding: isMobile ? '6px 8px' : '10px 14px',
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
              borderTop: '1px solid theme.bgSecondary',
              overflowX: 'auto',
              flexShrink: 0
            }}>
              <button 
                onClick={() => setShowMenuModal(true)}
                title="Table Operations Menu"
                style={{
                  padding: '9px 12px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                  color: theme.text,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  flexShrink: 0
                }}
              >
                ≡
              </button>

              <button 
                onClick={handleOpenTable}
                style={{
                  flex: 1,
                  minWidth: '65px',
                  padding: '10px 8px',
                  backgroundColor: theme.accent,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: isMobile ? '11px' : '13px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                OPEN
              </button>

              <button 
                onClick={() => setShowMessageModal(true)}
                style={{
                  flex: 1,
                  minWidth: '85px',
                  padding: '10px 8px',
                  backgroundColor: theme.text,
                  color: theme.inputBg,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: isMobile ? '10px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                MSG ➢
              </button>

              <button 
                onClick={() => {
                  setNewTableName(selectedTable.name);
                  setShowRenameModal(true);
                }}
                style={{
                  flex: 1,
                  minWidth: '85px',
                  padding: '10px 8px',
                  backgroundColor: theme.text,
                  color: theme.inputBg,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: isMobile ? '10px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                RENAME ✏️
              </button>

              <button 
                onClick={() => setShowMergeModal(true)}
                style={{
                  flex: 1,
                  minWidth: '75px',
                  padding: '10px 8px',
                  backgroundColor: theme.text,
                  color: theme.inputBg,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: isMobile ? '10px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                MERGE 🔗
              </button>

              <button 
                onClick={() => {
                  if (isMobile) setMobilePanel('bill');
                  else setShowAddItemModal(true);
                }}
                style={{
                  flex: 1,
                  minWidth: '75px',
                  padding: '10px 8px',
                  backgroundColor: theme.text,
                  color: theme.inputBg,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: isMobile ? '10px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                BILL 🧾
              </button>
            </div>
          </div>
        )}

        {/* ── Right Side Panel: Table Details & Cheques/Bill ── */}
        {(!isMobile || mobilePanel === 'bill') && (
          <div style={{
            width: isMobile ? '100%' : isTablet ? '290px' : '360px',
            backgroundColor: darkMode ? '#1a1a1a' : '#f1f5f9',
            borderLeft: isMobile ? 'none' : (darkMode ? '2px solid #334155' : '2px solid #cbd5e1'),
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100%'
          }}>
            {/* Table Header Info with Feature 6: Customer CRM Pairing */}
            <div style={{
              padding: '12px 14px',
              borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  Table #{selectedTable.name}
                </h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setShowCustomerPairModal(true)}
                    title="Link Customer CRM / Reservation"
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    👤 {tableCustomers[selectedTableId]?.name ? tableCustomers[selectedTableId].name.split(' ')[0] : 'Link CRM'}
                  </button>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + Item
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                <span
                  onClick={() => {
                    setEditGuestCount(selectedTable.guests || 2);
                    setShowGuestsModal(true);
                  }}
                  title="Click to edit guest count"
                  style={{ cursor: 'pointer', backgroundColor: darkMode ? '#2a2a2a' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', color: darkMode ? '#f1f5f9' : '#1e293b', fontWeight: '600' }}
                >
                  👥 {selectedTable.guests || 0} Guests ✏️
                </span>
                <span style={{ color: seatingStage.color, fontWeight: '700' }}>⏱️ {seatingStage.label}</span>
                <span 
                  onClick={() => setShowNoteModal(true)}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ✏️ Note
                </span>
              </div>
            </div>

            {/* Sub-split: Cheques Column + Bill Detail Panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Cheques Selector Column */}
              <div style={{
                width: isMobile ? '65px' : '75px',
                backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc',
                borderRight: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                padding: '8px 4px',
                gap: '8px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>
                  Cheques
                </span>

                {(tableBills[selectedTableId]?.cheques || [{ id: '#C198' }]).map(chq => {
                  const isSelected = activeChequeId === chq.id;
                  return (
                    <div
                      key={chq.id}
                      onClick={() => setActiveChequeId(chq.id)}
                      style={{
                        padding: '10px 4px',
                        backgroundColor: isSelected ? '#6366f1' : (darkMode ? '#1a1a1a' : '#ffffff'),
                        color: isSelected ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #6366f1' : (darkMode ? '1px solid #334155' : '1px solid #e2e8f0'),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}
                    >
                      <span>🧾</span>
                      <span>{chq.id}</span>
                    </div>
                  );
                })}

                <button
                  onClick={handleAddCheque}
                  style={{
                    padding: '10px 4px',
                    backgroundColor: darkMode ? '#2a2a2a' : '#e2e8f0',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    border: darkMode ? '1px dashed #475569' : '1px dashed #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>+</span> NEW
                </button>
              </div>

              {/* Bill / Logs Tabbed Detail View */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                
                {/* Tabs header */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ display: 'flex', borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1', flexShrink: 0 }}>
                    <button
                      onClick={() => setActiveTab('Bill')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: activeTab === 'Bill' ? (darkMode ? '#2a2a2a' : '#e2e8f0') : (darkMode ? '#0f0f0f' : '#f8fafc'),
                        color: activeTab === 'Bill' ? (darkMode ? '#f1f5f9' : '#1e293b') : (darkMode ? '#94a3b8' : '#64748b'),
                        border: 'none',
                        borderBottom: activeTab === 'Bill' ? '2px solid #6366f1' : 'none',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Bill
                    </button>
                    <button
                      onClick={() => setActiveTab('Logs')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: activeTab === 'Logs' ? (darkMode ? '#2a2a2a' : '#e2e8f0') : (darkMode ? '#0f0f0f' : '#f8fafc'),
                        color: activeTab === 'Logs' ? (darkMode ? '#f1f5f9' : '#1e293b') : (darkMode ? '#94a3b8' : '#64748b'),
                        border: 'none',
                        borderBottom: activeTab === 'Logs' ? '2px solid #6366f1' : 'none',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Logs ({tableLogs[selectedTableId]?.length || 0})
                    </button>
                  </div>

                  {activeTab === 'Bill' ? (
                    <>
                      {/* Feature 4: Seat-by-Seat Filter Chips */}
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        padding: '6px 8px',
                        backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc',
                        borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                        overflowX: 'auto',
                        flexShrink: 0
                      }}>
                        {['All', '1', '2', '3', '4'].map(st => (
                          <button
                            key={st}
                            onClick={() => setSelectedSeatId(st)}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: selectedSeatId === st ? '#6366f1' : (darkMode ? '#2a2a2a' : '#e2e8f0'),
                              color: selectedSeatId === st ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {st === 'All' ? 'All Seats' : `Seat ${st}`}
                          </button>
                        ))}
                      </div>

                      {/* Table Items Header with Interactive Sort Controls */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                        flexShrink: 0
                      }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          {/* Qty sort header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ color: itemSortKey === 'qty' ? '#6366f1' : (darkMode ? '#94a3b8' : '#64748b') }}>Qty</span>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                              <button
                                onClick={() => { setItemSortKey('qty'); setItemSortDir('asc'); }}
                                title="Sort Qty Ascending"
                                style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'qty' && itemSortDir === 'asc' ? '#6366f1' : (darkMode ? '#94a3b8' : '#64748b') }}
                              >▲</button>
                              <button
                                onClick={() => { setItemSortKey('qty'); setItemSortDir('desc'); }}
                                title="Sort Qty Descending"
                                style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'qty' && itemSortDir === 'desc' ? theme.accent : theme.textSecondary }}
                              >▼</button>
                            </div>
                          </div>

                          {/* Article sort header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ color: itemSortKey === 'article' ? theme.accent : theme.textSecondary }}>Article</span>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                              <button
                                onClick={() => { setItemSortKey('article'); setItemSortDir('asc'); }}
                                title="Sort Article Ascending"
                                style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'article' && itemSortDir === 'asc' ? theme.accent : theme.textSecondary }}
                              >▲</button>
                              <button
                                onClick={() => { setItemSortKey('article'); setItemSortDir('desc'); }}
                                title="Sort Article Descending"
                                style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'article' && itemSortDir === 'desc' ? theme.accent : theme.textSecondary }}
                              >▼</button>
                            </div>
                          </div>
                        </div>

                        {/* Price sort header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ color: itemSortKey === 'price' ? theme.accent : theme.textSecondary }}>Price</span>
                          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            <button
                              onClick={() => { setItemSortKey('price'); setItemSortDir('asc'); }}
                              title="Sort Price Ascending"
                              style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'price' && itemSortDir === 'asc' ? theme.accent : theme.textSecondary }}
                            >▲</button>
                            <button
                              onClick={() => { setItemSortKey('price'); setItemSortDir('desc'); }}
                              title="Sort Price Descending"
                              style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, color: itemSortKey === 'price' && itemSortDir === 'desc' ? theme.accent : theme.textSecondary }}
                            >▼</button>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                        {sortedBillItems && sortedBillItems.length > 0 ? (
                          sortedBillItems.map(item => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '4px 6px', backgroundColor: darkMode ? '#1a1a1a' : '#ffffff', borderRadius: '4px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleItemDeleteClick(item)}
                                    title={item.tag || item.isFired ? `Void Fired Item: ${item.name}` : `Remove ${item.name}`}
                                    style={{
                                      background: darkMode ? '#2a2a2a' : '#f1f5f9',
                                      color: '#ef4444',
                                      border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '18px',
                                      height: '18px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: '900',
                                      cursor: 'pointer',
                                      lineHeight: 1,
                                      marginRight: '2px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                  <span style={{ fontWeight: '700', color: darkMode ? '#f1f5f9' : '#1e293b' }}>{item.qty}</span>
                                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>{item.name}</span>
                                  <span style={{ fontSize: '9px', color: darkMode ? '#94a3b8' : '#64748b', backgroundColor: darkMode ? '#2a2a2a' : '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>
                                    S{item.seat || 1}
                                  </span>
                                  {item.tag && (
                                    <span style={{
                                      backgroundColor: item.tag === 'ST' ? (darkMode ? '#475569' : '#cbd5e1') : '#6366f1',
                                      color: item.tag === 'ST' ? (darkMode ? '#f1f5f9' : '#1e293b') : '#ffffff',
                                      fontSize: '8px',
                                      fontWeight: '700',
                                      padding: '1px 3px',
                                      borderRadius: '3px'
                                    }}>
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px' }}>
                            No items on this cheque
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Audit Logs Tab View */
                    <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(tableLogs[selectedTableId] || []).map(log => (
                        <div key={log.id} style={{ padding: '6px 8px', backgroundColor: theme.bg, borderRadius: '4px', borderLeft: `3px solid ${theme.accent}`, fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary, fontSize: '9px' }}>
                            <span>{log.time}</span>
                            <span style={{ color: theme.accent, fontWeight: '600' }}>👤 {log.staff || (staff && staff[0] ? staff[0].name : 'Staff')}</span>
                          </div>
                          <div style={{ color: theme.text, marginTop: '2px' }}>{log.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals, Feature 5 Course Firing Controls & Action Buttons Footer */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid theme.bgSecondary', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  {/* Dynamic Course Firing Buttons */}
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                    {(() => {
                      const categories = Array.from(new Set([
                        ...(settings.courses || ['Starters', 'Mains', 'Desserts', 'Beverages']),
                        ...(activeBill.items || []).map(i => i.tag === 'ST' ? 'Starters' : i.tag === 'DS' ? 'Desserts' : i.tag === 'MN' ? 'Mains' : i.tag === 'WN' ? 'Beverages' : i.category || 'Mains')
                      ])).slice(0, 4);

                      return categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleFireCourse(cat)}
                          style={{ flex: 1, padding: '4px 6px', backgroundColor: darkMode ? '#2a2a2a' : '#e2e8f0', color: darkMode ? '#f1f5f9' : '#1e293b', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          🔥 Fire {cat}
                        </button>
                      ));
                    })()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {allocatedDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                        <span>Discount</span>
                        <span>-₹{allocatedDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      <span>GST ({gstRatePct}%)</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      <span>Service Charge ({serviceChargeRatePct}%)</span>
                      <span>₹{serviceChargeAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#f1f5f9' : '#1e293b', fontWeight: '700', fontSize: '15px', marginTop: '4px', borderTop: darkMode ? '1px solid #334155' : '1px solid #cbd5e1', paddingTop: '4px' }}>
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => setShowSplitModal(true)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
                        color: darkMode ? '#f1f5f9' : '#1e293b',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      SPLIT
                    </button>
                    <button 
                      onClick={() => setShowNWaySplitModal(true)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: darkMode ? '#ffffff' : '#1e293b',
                        color: darkMode ? '#1e293b' : '#ffffff',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      🧮 N-WAY
                    </button>
                    <button 
                      onClick={() => setShowTransferModal(true)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: darkMode ? '#ffffff' : '#1e293b',
                        color: darkMode ? '#1e293b' : '#ffffff',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ⇄ MOVE
                    </button>
                    <button 
                      onClick={() => setShowTimedHoldModal(true)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: darkMode ? '#ffffff' : '#1e293b',
                        color: darkMode ? '#1e293b' : '#ffffff',
                        border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ HOLD
                    </button>
                  </div>

                  <button
                    onClick={handlePay}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    PAY
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Feature Modals ── */}

      {/* Feature 1: Add New Table / Element Builder Modal */}
      {showAddTableModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Add Element to Floor</h3>
            <p style={{ margin: 0, fontSize: '11px', color: theme.border, marginBottom: '12px' }}>Configure table, wall, or floor element properties</p>
            
            {/* Section: Basic Info */}
            <div style={{ padding: '12px', background: theme.bgSecondary, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <label style={{ fontSize: '11px', color: theme.border, fontWeight: '600', marginBottom: '6px', display: 'block' }}>ELEMENT TYPE</label>
              <select
                value={newElementData.type}
                onChange={(e) => setNewElementData({ ...newElementData, type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, fontSize: '13px' }}
              >
                <option value="table">🪑 Table</option>
                <option value="wall">🧱 Wall / Barrier</option>
                <option value="door">🚪 Door</option>
                <option value="window">🪟 Window</option>
                <option value="pillar">🏛️ Pillar</option>
                <option value="bar_counter">🍸 Bar Counter</option>
                <option value="entrance">🚶 Entrance</option>
                <option value="stage">🎭 Stage</option>
              </select>

              <label style={{ fontSize: '11px', color: theme.border, fontWeight: '600', marginBottom: '6px', display: 'block', marginTop: '10px' }}>LABEL / NUMBER</label>
              <input
                type="text"
                value={newElementData.name}
                onChange={(e) => setNewElementData({ ...newElementData, name: e.target.value })}
                placeholder="e.g. 20 or VIP-1"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box', fontSize: '13px' }}
              />
            </div>

            {/* Section: Shape & Preview - For all element types */}
            <div style={{ padding: '12px', background: theme.bgSecondary, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <label style={{ fontSize: '11px', color: theme.border, fontWeight: '600', marginBottom: '6px', display: 'block' }}>SHAPE</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'rect' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'rect' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ▭ Rectangle
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'circle' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'circle' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ⚪ Round
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'square' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'square' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ⬜ Square
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'oval' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'oval' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ⬭ Oval
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'booth' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'booth' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  🛋️ Booth
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'high_top' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'high_top' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  🍸 High Top
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'l_shaped' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'l_shaped' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  └ L-Shaped
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 'u_shaped' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 'u_shaped' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ┌ U-Shaped
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, shape: 't_shaped' })}
                  style={{ padding: '8px', backgroundColor: newElementData.shape === 't_shaped' ? theme.accent : theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  ├ T-Shaped
                </button>
              </div>

              {/* Live Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: theme.inputBg, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '11px', color: theme.border, minWidth: '60px' }}>Preview:</div>
                <div style={{
                  width: `${Math.min((newElementData.width || 100) / 2, 60)}px`,
                  height: `${Math.min((newElementData.height || 100) / 2, 60)}px`,
                  background: getElementColor(newElementData.type),
                  borderRadius: newElementData.shape === 'circle' || newElementData.shape === 'round' ? '50%' : '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: theme.bg,
                  transform: `rotate(${newElementData.rotation || 0}deg)`,
                  border: getBorderStyle(newElementData.type, newElementData.wallType),
                  minWidth: '30px',
                  minHeight: '30px'
                }}>
                  {newElementData.name || getElementIcon(newElementData.type)}
                </div>
                <div style={{ fontSize: '10px', color: theme.textSecondary }}>
                  {newElementData.width || 100} × {newElementData.height || 100}px
                  {newElementData.rotation && ` | ${newElementData.rotation}°`}
                </div>
              </div>
            </div>

            {/* Section: Dimensions */}
            <div style={{ padding: '12px', background: theme.bgSecondary, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <label style={{ fontSize: '11px', color: theme.border, fontWeight: '600', marginBottom: '6px', display: 'block' }}>DIMENSIONS</label>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => setNewElementData({ ...newElementData, width: 80, height: 80 })}
                  style={{ flex: 1, padding: '6px', backgroundColor: theme.inputBg, color: theme.border, border: `1px solid ${theme.textSecondary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                  Small
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, width: 100, height: 100 })}
                  style={{ flex: 1, padding: '6px', backgroundColor: theme.inputBg, color: theme.border, border: `1px solid ${theme.textSecondary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                  Medium
                </button>
                <button
                  onClick={() => setNewElementData({ ...newElementData, width: 140, height: 140 })}
                  style={{ flex: 1, padding: '6px', backgroundColor: theme.inputBg, color: theme.border, border: `1px solid ${theme.textSecondary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                  Large
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '4px', display: 'block' }}>Width (px)</label>
                  <input
                    type="number"
                    value={newElementData.width || 100}
                    onChange={(e) => setNewElementData({ ...newElementData, width: parseInt(e.target.value) || 100 })}
                    min="50"
                    max="300"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '4px', display: 'block' }}>Height (px)</label>
                  <input
                    type="number"
                    value={newElementData.height || 100}
                    onChange={(e) => setNewElementData({ ...newElementData, height: parseInt(e.target.value) || 100 })}
                    min="50"
                    max="300"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Capacity - Only for tables */}
              {newElementData.type === 'table' && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '4px', display: 'block' }}>Capacity (seats)</label>
                  <input
                    type="number"
                    value={newElementData.capacity || 4}
                    onChange={(e) => setNewElementData({ ...newElementData, capacity: parseInt(e.target.value) || 4 })}
                    min="1"
                    max="20"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box', fontSize: '12px' }}
                  />
                </div>
              )}
            </div>

            {/* Section: Advanced */}
            <div style={{ padding: '12px', background: theme.bgSecondary, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <label style={{ fontSize: '11px', color: theme.border, fontWeight: '600', marginBottom: '6px', display: 'block' }}>ADVANCED</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '4px', display: 'block' }}>Rotation (°)</label>
                  <input
                    type="number"
                    value={newElementData.rotation || 0}
                    onChange={(e) => setNewElementData({ ...newElementData, rotation: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="360"
                    step="15"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box', fontSize: '12px' }}
                  />
                </div>
                {/* Wall Type - Only for walls, doors, windows */}
                {(newElementData.type === 'wall' || newElementData.type === 'door' || newElementData.type === 'window') && (
                  <div>
                    <label style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '4px', display: 'block' }}>Wall Type</label>
                    <select
                      value={newElementData.wallType || 'solid'}
                      onChange={(e) => setNewElementData({ ...newElementData, wallType: e.target.value })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: darkMode ? '#2a2a2a' : '#f1f5f9', color: darkMode ? '#f1f5f9' : '#1e293b', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', fontSize: '12px' }}
                    >
                      <option value="solid">Solid</option>
                      <option value="glass">Glass</option>
                      <option value="curtain">Curtain</option>
                      <option value="railing">Railing</option>
                      <option value="plant">Plant</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Table-specific options */}
              {newElementData.type === 'table' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.textSecondary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newElementData.canCombine || false}
                      onChange={(e) => setNewElementData({ ...newElementData, canCombine: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Can Combine
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.textSecondary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newElementData.wallNearby || false}
                      onChange={(e) => setNewElementData({ ...newElementData, wallNearby: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Wall Nearby
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.textSecondary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newElementData.windowNearby || false}
                      onChange={(e) => setNewElementData({ ...newElementData, windowNearby: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Window Nearby
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowAddTableModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleAddTableElement} style={{ flex: 1, padding: '12px', backgroundColor: theme.success, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Add Element</button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 3: Merge Tables Modal */}
      {showMergeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Merge Table #{selectedTable.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.border }}>
              Select adjacent table to connect visually on the floor plan map:
            </p>
            <select
              value={targetMergeTableId}
              onChange={(e) => setTargetMergeTableId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}` }}
            >
              <option value="">Select table to merge...</option>
              {floorTables.filter(t => t.id !== selectedTableId && t.type !== 'wall').map(t => (
                <option key={t.id} value={t.id}>Table #{t.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleMergeTables} style={{ flex: 1, padding: '10px', backgroundColor: theme.warning, color: theme.inputBg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Merge Tables</button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 6: Customer CRM / Reservation Pairing Modal */}
      {showCustomerPairModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '380px',
            maxHeight: '480px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Link Customer / Reservation</h3>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme.accent,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + New Customer
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Search by name or phone..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                color: theme.text,
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '180px' }}>
              {(customers && customers.length > 0 ? customers : [
                { id: 'c1', name: 'Ankit Patel', phone: '+91 9876543210', points: 140 },
                { id: 'c2', name: 'Priya Sharma', phone: '+91 9812345678', points: 95 },
                { id: 'c3', name: 'Rahul Mehta', phone: '+91 9765432109', points: 210 }
              ])
              .filter(c => !customerSearchQuery || c.name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone?.includes(customerSearchQuery))
              .map(c => (
                <div
                  key={c.id}
                  onClick={() => handlePairCustomer(c)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: theme.inputBg,
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: theme.border }}>{c.phone}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: theme.warning, fontWeight: '700' }}>⭐ {c.points || 0} pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCustomerPairModal(false)} style={{ padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Inline Create New Customer Modal */}
      {showAddCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Add New Customer</h3>
            <input
              type="text"
              placeholder="Full Name *"
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#2a2a2a' : '#f1f5f9', color: darkMode ? '#f1f5f9' : '#1e293b', boxSizing: 'border-box' }}
            />
            <input
              type="text"
              placeholder="Phone Number *"
              value={newCustomerData.phone}
              onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAddCustomerModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => {
                  if (!newCustomerData.name.trim()) return;
                  const created = { id: `c-${Date.now()}`, name: newCustomerData.name, phone: newCustomerData.phone, points: 50 };
                  setCustomers && setCustomers([...customers, created]);
                  handlePairCustomer(created);
                  setShowAddCustomerModal(false);
                  setNewCustomerData({ name: '', phone: '', email: '', points: 50 });
                }}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
              >
                Save & Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ Dedicated Toast Tables Quick POS Register Modal ⚡ */}
      {showQuickPOSModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div style={{
            width: '90vw',
            maxWidth: '850px',
            height: '80vh',
            maxHeight: '650px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${theme.bgSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Quick POS Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
              borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                  ⚡ Quick POS Register — Table #{selectedTable.name}
                </h3>
                <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', marginTop: '4px' }}>
                  Real-time item selection • Auto-routes KOT to Kitchen KDS displays • Indian Rupees (₹)
                </span>
              </div>
              <button
                onClick={() => setShowQuickPOSModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: darkMode ? '#f1f5f9' : '#f1f5f9',
                  color: darkMode ? '#1e293b' : '#1e293b',
                  border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Quick POS Main Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Side: Items & Categories */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', borderRight: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', minWidth: 0, backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc' }}>
                
                {/* Search & Category Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={quickPOSSearch}
                    onChange={(e) => setQuickPOSSearch(e.target.value)}
                    placeholder="Search menu item or barcode..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                      border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: darkMode ? '#f1f5f9' : '#1e293b',
                      fontSize: '14px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['All', 'Beverages', 'Breakfast', 'Bakery', 'Entrees', 'Desserts', 'Salads'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setQuickPOSCategory(cat)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: quickPOSCategory === cat ? '#6366f1' : (darkMode ? '#1a1a1a' : '#ffffff'),
                          color: quickPOSCategory === cat ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                          border: quickPOSCategory === cat ? 'none' : (darkMode ? '1px solid #334155' : '1px solid #cbd5e1'),
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px',
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {(menuItems && menuItems.length > 0 ? menuItems : [
                    { id: 'm1', name: 'Fried Calamari', price: 340.00, category: 'Entrees' },
                    { id: 'm2', name: 'Coca Cola Zero', price: 90.00, category: 'Beverages' },
                    { id: 'm3', name: 'Tiramisu', price: 250.00, category: 'Desserts' },
                    { id: 'm4', name: 'Avocado Toast', price: 280.00, category: 'Breakfast' },
                    { id: 'm5', name: 'Cappuccino', price: 180.00, category: 'Beverages' },
                    { id: 'm6', name: 'Grilled Ribeye Steak', price: 850.00, category: 'Entrees' },
                    { id: 'm7', name: 'Cold Brew Coffee', price: 190.00, category: 'Beverages' },
                    { id: 'm8', name: 'Chocolate Croissant', price: 140.00, category: 'Bakery' },
                    { id: 'm9', name: 'Caesar Salad', price: 220.00, category: 'Salads' }
                  ])
                  .filter(mi => quickPOSCategory === 'All' || mi.category === quickPOSCategory)
                  .filter(mi => !quickPOSSearch || mi.name.toLowerCase().includes(quickPOSSearch.toLowerCase()))
                  .map(mi => (
                    <div
                      key={mi.id}
                      onClick={() => addToQuickPOSCart(mi)}
                      style={{
                        padding: '16px 12px',
                        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                        border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(99,102,241,0.3)' : '0 4px 12px rgba(99,102,241,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', marginBottom: '8px', lineHeight: '1.3' }}>
                        {mi.name}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        ₹{mi.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Quick POS Order Terminal Summary */}
              <div style={{
                width: '340px',
                backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                borderLeft: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                      Register Cart ({quickPOSCart.reduce((acc, i) => acc + i.qty, 0)})
                    </h4>
                    {quickPOSCart.length > 0 && (
                      <button
                        onClick={() => setQuickPOSCart([])}
                        style={{ background: 'none', border: 'none', color: darkMode ? '#ef4444' : '#ef4444', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>

                  {/* Seat Assignment Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', backgroundColor: darkMode ? '#2a2a2a' : '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1' }}>
                    <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>SEAT:</span>
                    {[1, 2, 3, 4].map(s => (
                      <button
                        key={s}
                        onClick={() => setQuickPOSSelectedSeat(s)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: quickPOSSelectedSeat === s ? '#6366f1' : (darkMode ? '#1a1a1a' : '#ffffff'),
                          color: quickPOSSelectedSeat === s ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                          border: quickPOSSelectedSeat === s ? 'none' : (darkMode ? '1px solid #334155' : '1px solid #cbd5e1'),
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        }}
                      >
                        Seat {s}
                      </button>
                    ))}
                  </div>

                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                    {quickPOSCart.length > 0 ? (
                      quickPOSCart.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '12px', backgroundColor: darkMode ? '#2a2a2a' : '#f1f5f9', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                              <span>{item.name}</span>
                              <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', backgroundColor: darkMode ? '#334155' : '#e2e8f0', padding: '2px 6px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>S{item.seat || 1}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>₹{item.price.toFixed(2)} × {item.qty}</div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setQuickPOSCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0));
                              }}
                              style={{ width: '26px', height: '26px', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#f1f5f9' : '#1e293b', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', width: '20px', textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>{item.qty}</span>
                            <button
                              onClick={() => {
                                setQuickPOSCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
                              }}
                              style={{ width: '26px', height: '26px', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#f1f5f9' : '#1e293b', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', border: darkMode ? '1px dashed #334155' : '1px dashed #cbd5e1', borderRadius: '8px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                        Tap menu items to add to order
                      </div>
                    )}
                  </div>

                  {/* Kitchen Special Note Input */}
                  <input
                    type="text"
                    value={quickPOSOrderNote}
                    onChange={(e) => setQuickPOSOrderNote(e.target.value)}
                    placeholder="Add special kitchen note (e.g. Extra spicy)..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                      border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: darkMode ? '#f1f5f9' : '#1e293b',
                      fontSize: '13px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      marginBottom: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Quick Order Submit */}
                <div style={{ borderTop: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '15px', color: darkMode ? '#f1f5f9' : '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                    <span>Subtotal</span>
                    <span>₹{quickPOSCart.reduce((sum, i) => sum + (i.price * i.qty), 0).toFixed(2)}</span>
                  </div>

                  <button
                    onClick={submitQuickPOSOrder}
                    disabled={quickPOSCart.length === 0}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: quickPOSCart.length > 0 ? '#6366f1' : (darkMode ? '#2a2a2a' : '#e2e8f0'),
                      color: quickPOSCart.length > 0 ? '#ffffff' : (darkMode ? '#64748b' : '#94a3b8'),
                      border: quickPOSCart.length > 0 ? 'none' : (darkMode ? '1px solid #334155' : '1px solid #cbd5e1'),
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: quickPOSCart.length > 0 ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase',
                      opacity: quickPOSCart.length > 0 ? '1' : '0.5',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Send to Kitchen & Table (KOT)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Hamburger Operations Menu Modal */}
      {showMenuModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #cbd5e1', paddingBottom: '12px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
              Table #{selectedTable.name} Options
            </h3>
            <button
              onClick={() => {
                setShowMenuModal(false);
                setShowQRModal(true);
              }}
              style={{ padding: '12px', backgroundColor: theme.text, color: theme.bgfff, border: `1px solid ${theme.text}`, borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              📱 Print Table QR Standee
            </button>
            <button
              onClick={() => { handleOpenTable(); setShowMenuModal(false); }}
              style={{ padding: '12px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              Open / Seat Table
            </button>
            <button
              onClick={handleClearTable}
              style={{ padding: '12px', backgroundColor: theme.danger, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              Clear Table
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Dirty', 'Sanitizing', 'VIP', 'Out of Service', 'Available'].map(stBadge => {
                const currentBadges = selectedTable.badges || (selectedTable.badge ? [selectedTable.badge] : []);
                const isTagged = currentBadges.includes(stBadge);
                return (
                  <button
                    key={stBadge}
                    onClick={() => {
                      setFloorTables(prev => prev.map(t => {
                        if (t.id !== selectedTableId) return t;
                        if (stBadge === 'Available') return { ...t, badge: undefined, badges: [] };
                        const existing = t.badges || (t.badge ? [t.badge] : []);
                        const updated = existing.includes(stBadge)
                          ? existing.filter(b => b !== stBadge)
                          : [...existing, stBadge];
                        return { ...t, badge: updated[0] || undefined, badges: updated };
                      }));
                      addLog(selectedTableId, isTagged ? `Removed ${stBadge} tag` : `Added ${stBadge} tag`);
                      setShowMenuModal(false);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: isTagged ? theme.success : stBadge === 'Dirty' ? theme.danger : stBadge === 'Sanitizing' ? theme.accent : stBadge === 'VIP' ? theme.textSecondary : stBadge === 'Out of Service' ? theme.textSecondary : theme.border,
                      color: theme.bg,
                      border: isTagged ? '2px solid theme.text' : 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isTagged ? `✓ ${stBadge}` : `Tag ${stBadge}`}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowMenuModal(false)}
              style={{ padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kitchen Message Modal */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '340px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Send Kitchen Note (Table #{selectedTable.name})</h3>
            <textarea
              value={kitchenMessage}
              onChange={(e) => setKitchenMessage(e.target.value)}
              placeholder="Enter instruction for kitchen station..."
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowMessageModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendMessage} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Send KOT Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Table Modal */}
      {showRenameModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '300px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Rename Table</h3>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Table name or number"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowRenameModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRenameTable} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item to Bill Modal */}
      {showAddItemModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '360px',
            maxHeight: '420px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Add Item to Table #{selectedTable.name}</h3>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(menuItems && menuItems.length > 0 ? menuItems : [
                { id: 'm1', name: 'Fried Calamari', price: 340.00 },
                { id: 'm2', name: 'Coca cola zero', price: 90.00 },
                { id: 'm3', name: 'Tiramisu', price: 250.00 },
                { id: 'm4', name: 'Avocado Toast', price: 280.00 },
                { id: 'm5', name: 'Cappuccino', price: 180.00 },
                { id: 'm6', name: 'Grilled Ribeye Steak', price: 850.00 }
              ]).map(mi => (
                <div
                  key={mi.id}
                  onClick={() => handleAddItemToBill(mi)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: theme.inputBg,
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{mi.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: theme.success }}>₹{mi.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddItemModal(false)} style={{ padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '300px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Apply Discount (₹)</h3>
            <input
              type="number"
              value={discountAmountInput}
              onChange={(e) => setDiscountAmountInput(e.target.value)}
              placeholder="Discount amount (e.g. 50.00)"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDiscountModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleApplyDiscount} style={{ flex: 1, padding: '10px', backgroundColor: theme.success, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Transfer / Move Party Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>⇄ Transfer Table #{selectedTable.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.border }}>
              Select target table to move active bill checks, items, and timers:
            </p>
            <select
              value={transferTargetTableId}
              onChange={(e) => setTransferTargetTableId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg }}
            >
              <option value="">Select Destination Table...</option>
              {floorTables
                .filter(t => t.id !== selectedTableId)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    Table #{t.name} ({t.status === 'occupied' ? 'Occupied' : 'Available'}) - {t.section}
                  </option>
                ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowTransferModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleTransferTable} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Transfer Party</button>
            </div>
          </div>
        </div>
      )}

      {/* Timed Prep Hold Modal */}
      {showTimedHoldModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>⏱️ Timed Prep Hold / Delayed Fire</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.border }}>
              Set a delayed timer before firing KOT ticket to kitchen:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 10, 15, 30].map(m => (
                <button
                  key={m}
                  onClick={() => setTimedHoldMinutes(m)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: timedHoldMinutes === m ? theme.warning : theme.inputBg,
                    color: theme.bg,
                    border: `1px solid ${theme.textSecondary}`,
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {m}m Hold
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowTimedHoldModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleFireCourse('Hold Course', timedHoldMinutes)} style={{ flex: 1, padding: '10px', backgroundColor: theme.warning, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Schedule Hold</button>
            </div>
          </div>
        </div>
      )}

      {/* N-Way Equal Bill Split Modal */}
      {showNWaySplitModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '340px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>🧮 N-Way Equal Bill Splitter</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.border }}>
              Subtotal: ₹{calculateTotal().toFixed(2)}
            </p>
            <label style={{ fontSize: '12px', color: theme.textSecondary }}>Number of Equal Payments (Guests):</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setNWaySplitCount(Math.max(2, nWaySplitCount - 1))} style={{ padding: '6px 14px', backgroundColor: theme.border, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700' }}>-</button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700' }}>{nWaySplitCount} Ways</span>
              <button onClick={() => setNWaySplitCount(nWaySplitCount + 1)} style={{ padding: '6px 14px', backgroundColor: theme.border, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700' }}>+</button>
            </div>
            <div style={{ backgroundColor: theme.inputBg, padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: theme.border }}>Each Guest Pays:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: theme.success }}>
                ₹{(calculateTotal() / nWaySplitCount).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowNWaySplitModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmNWaySplit} style={{ flex: 1, padding: '10px', backgroundColor: theme.success, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Confirm N-Way Split</button>
            </div>
          </div>
        </div>
      )}

      {/* Item-Level Split Cheque Modal */}
      {showSplitModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '380px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>✂️ Itemized Cheque Split</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.border }}>
              Select specific items to move from cheque {activeChequeId} into a new split cheque:
            </p>

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: theme.inputBg, padding: '10px', borderRadius: '8px' }}>
              {(activeBill.items || []).map(item => {
                const isSelected = selectedSplitItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedSplitItemIds(prev =>
                        isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                      );
                    }}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: isSelected ? theme.bgSecondary : theme.bgSecondary,
                      borderRadius: '6px',
                      border: isSelected ? '1px solid theme.accent' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span><strong>{item.qty}x</strong> {item.name} (Seat {item.seat || 1})</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.success }}>
                      ₹{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => { setSelectedSplitItemIds([]); setShowSplitModal(false); }} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmItemSplit} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                Split ({selectedSplitItemIds.length}) Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toastMessage.type === 'error' ? theme.danger : toastMessage.type === 'warning' ? theme.warning : toastMessage.type === 'success' ? theme.success : theme.accent,
          color: theme.text,
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 3500,
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <span>{toastMessage.type === 'error' ? '⚠️' : toastMessage.type === 'warning' ? '🔔' : '✅'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* ⚠️ Generic Action Confirmation Modal */}
      {confirmModalConfig && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            width: '340px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#f59e0b' }}>⚠️ {confirmModalConfig.title}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>
              {confirmModalConfig.message}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setConfirmModalConfig(null)}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cb = confirmModalConfig.onConfirm;
                  setConfirmModalConfig(null);
                  cb && cb();
                }}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.danger, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '320px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Table Note</h3>
            <textarea
              value={tableNote}
              onChange={(e) => setTableNote(e.target.value)}
              placeholder="Special customer note or VIP instructions..."
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.textSecondary}`, backgroundColor: theme.inputBg, color: theme.bg, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowNoteModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveNote} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paymentAmount={paymentAmount}
          onPaymentAmountChange={setPaymentAmount}
          cartTotal={subtotal}
          discount={allocatedDiscount > 0 && subtotal > 0 ? (allocatedDiscount / subtotal) * 100 : 0}
          tipAmount={tipAmount}
          onTipAmountChange={setTipAmount}
          gstRate={gstRatePct}
          onCheckout={handlePaymentComplete}
          screenSize={isMobile ? 'small' : isTablet ? 'medium' : 'large'}
          darkMode={darkMode}
        />
      )}

      {/* Manager Void Item Modal */}
      {showVoidModal && itemToVoid && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            width: '350px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            border: `2px solid ${theme.danger}`,
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#ef4444' }}>⛔ MANAGER VOID REQUIRED</h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary }}>
              Item <strong style={{ color: theme.text }}>"{itemToVoid.name}"</strong> has already been fired to the kitchen. Select a void reason and enter Manager PIN:
            </p>
            <div>
              <label style={{ fontSize: '11px', color: theme.border, display: 'block', marginBottom: '4px' }}>Void Reason *</label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}` }}
              >
                <option value="Customer changed mind">Customer changed mind</option>
                <option value="Order mistake by server">Order mistake by server</option>
                <option value="Out of stock / kitchen unavailable">Out of stock / kitchen unavailable</option>
                <option value="Quality issue / return">Quality issue / return</option>
                <option value="Manager complimentary / void">Manager complimentary / void</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: theme.border, display: 'block', marginBottom: '4px' }}>Manager PIN * (Default: 1234)</label>
              <input
                type="password"
                placeholder="Enter Manager PIN"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: theme.inputBg, color: theme.bg, border: `1px solid ${theme.textSecondary}`, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={() => setShowVoidModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmVoidItem} style={{ flex: 1, padding: '10px', backgroundColor: theme.danger, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>CONFIRM VOID</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Guests Count Modal */}
      {showGuestsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500
        }}>
          <div style={{
            width: '300px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>Edit Guest Count (Table #{selectedTable.name})</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '10px 0' }}>
              <button
                onClick={() => setEditGuestCount(prev => Math.max(1, prev - 1))}
                style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme.border, color: theme.bg, border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
              >-</button>
              <span style={{ fontSize: '24px', fontWeight: '800', color: theme.accent }}>{editGuestCount}</span>
              <button
                onClick={() => setEditGuestCount(prev => prev + 1)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme.border, color: theme.bg, border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
              >+</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowGuestsModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: theme.textSecondary, color: theme.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleUpdateGuestsCount(editGuestCount)} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Save Guests</button>
            </div>
          </div>
        </div>
      )}

      {/* Table QR Standee Print Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: theme.bgfff,
            border: `2px solid ${theme.text}`,
            borderRadius: '12px',
            padding: '24px',
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid theme.border', paddingBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', tracking: '0.05em', textTransform: 'uppercase' }}>📱 TABLE #{selectedTable.name} QR CODE</div>
              <button onClick={() => setShowQRModal(false)} style={{ background: 'none', border: 'none', color: theme.text, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div id="print-qr-standee" style={{ backgroundColor: theme.text, padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', border: '3px solid theme.bgfff' }}>
              <div style={{ color: theme.bgfff, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                TABLE #{selectedTable.name}
              </div>
              <div style={{ color: '#555555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em' }}>
                SCAN TO VIEW MENU & ORDER ONLINE
              </div>
              <QRCodeCanvas
                value={`${window.location.origin}/order?table=${encodeURIComponent(selectedTable.name)}`}
                size={180}
                level="H"
                includeMargin={true}
              />
              <div style={{ fontSize: '10px', color: '#555555', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {window.location.origin}/order?table={selectedTable.name}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowQRModal(false)}
                style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
              >
                CLOSE
              </button>
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank', 'width=500,height=600');
                  if (printWin) {
                    const canvasEl = document.querySelector('#print-qr-standee canvas');
                    const dataUrl = canvasEl ? canvasEl.toDataURL() : '';
                    printWin.document.write(`
                      <html>
                        <head>
                          <title>Table #${selectedTable.name} QR Standee</title>
                          <style>
                            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; background: #f8fafc; }
                            .card { border: 2px solid #cbd5e1; padding: 30px; border-radius: 16px; width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #ffffff; }
                            h1 { font-size: 28px; margin: 0 0 8px 0; color: #1e293b; font-weight: 700; }
                            p { font-size: 12px; color: #64748b; margin: 0 0 20px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                            img { width: 200px; height: 200px; margin-bottom: 14px; border-radius: 8px; }
                            .url { font-size: 11px; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <h1>TABLE #${selectedTable.name}</h1>
                            <p>Scan to view menu & order online</p>
                            <img src="${dataUrl}" alt="Table QR" />
                            <div class="url">${window.location.origin}/order?table=${selectedTable.name}</div>
                          </div>
                          <script>
                            window.onload = function() { window.print(); window.close(); };
                          </script>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                  }
                }}
                style={{ flex: 1, padding: '12px', backgroundColor: theme.text, color: theme.bgfff, border: `1px solid ${theme.text}`, borderRadius: '6px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                🖨️ PRINT STANDEE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && completedOrder && (
        <Receipt
          order={completedOrder}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
