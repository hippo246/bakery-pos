/**
 * Classic Orders Layout - Full POS Terminal
 * 
 * High-density, desktop-first POS terminal with:
 * - Top system status header (Terminal ID, toggles, item ticker)
 * - Left Panel (62%): Cart table, Quick bar inputs, Category tabs, Product grid
 * - Right Panel (38%): Function key grid, Numpad, Order summary, Payment buttons
 * - Full cart state management with real-time calculations
 * - Payment integration (Razorpay, UPI, Paytm)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import FunctionKeyPanel from '../classic-pos/FunctionKeyPanel';
import NumericKeypad from '../classic-pos/NumericKeypad';
import CategoryBar from '../classic-pos/CategoryBar';
import ProductGrid from '../classic-pos/ProductGrid';
import TopChrome from '../classic-pos/TopChrome';
import ActionButtons from '../classic-pos/ActionButtons';
import CartTable from '../classic-pos/CartTable';
import QuickBarInputs from '../classic-pos/QuickBarInputs';
import OrderSummaryPanel from '../classic-pos/OrderSummaryPanel';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';
import TablesModal from '../classic-pos/TablesModal';
import CustomerModal from '../classic-pos/CustomerModal';
import PaymentModal from '../payment/PaymentModal';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';

export default function ClassicOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [quickBarInputs, setQuickBarInputs] = useState({
    itemCode: '',
    description: '',
    qty: '1',
    price: '0.00',
    amount: '0.00',
    salesmanId: '',
  });
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [receiptPrintEnabled, setReceiptPrintEnabled] = useState(false);
  const [wholeSaleEnabled, setWholeSaleEnabled] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [heldOrders, setHeldOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [discountMode, setDiscountMode] = useState(null);
  const [focusedInput, setFocusedInput] = useState('itemCode');
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderType, setOrderType] = useState('walk-in');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedServer, setSelectedServer] = useState(null);
  const [taxExempt, setTaxExempt] = useState(false);
  const [showItemModificationsModal, setShowItemModificationsModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showVoidOrderModal, setShowVoidOrderModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showTableTransferModal, setShowTableTransferModal] = useState(false);
  const [showOrderMergeModal, setShowOrderMergeModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [splitPayments, setSplitPayments] = useState([]);
  const [kitchenStation, setKitchenStation] = useState('bar');
  const [receiptOptions, setReceiptOptions] = useState({
    showLogo: true,
    showCustomer: true,
    showTable: true,
    showServer: true,
    showGST: true,
    showDiscount: true,
    customFooter: 'Thank you for dining with us!',
    showTimestamp: true
  });
  const [showReceiptOptionsModal, setShowReceiptOptionsModal] = useState(false);
  const [showDayEndReportModal, setShowDayEndReportModal] = useState(false);
  
  // Inventory & Stock Management
  const [inventory, setInventory] = useState({
    items: {},
    lowStockThreshold: 10,
    locations: ['main', 'bar', 'kitchen']
  });
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showWasteTrackingModal, setShowWasteTrackingModal] = useState(false);
  const [allergyAlerts, setAllergyAlerts] = useState([]);
  
  // Initialize inventory with menu items
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      const initialInventory = {};
      menuItems.forEach(item => {
        initialInventory[item.id || item.name] = {
          quantity: Math.floor(Math.random() * 50) + 20, // Random stock between 20-70
          waste: 0,
          cost: item.price * 0.6 // Assume 60% cost
        };
      });
      setInventory(prev => ({ ...prev, items: initialInventory }));
    }
  }, [menuItems]);

  // Show low stock alerts
  useEffect(() => {
    const lowStockItems = Object.entries(inventory.items)
      .filter(([_, data]) => data.quantity <= inventory.lowStockThreshold)
      .map(([itemId, data]) => ({ itemId, quantity: data.quantity }));
    
    if (lowStockItems.length > 0 && allergyAlerts.length === 0) {
      setAllergyAlerts(lowStockItems.map(item => ({ 
        type: 'low_stock', 
        item: item.itemId, 
        quantity: item.quantity 
      })));
    }
  }, [inventory.items, inventory.lowStockThreshold, allergyAlerts.length]);
  
  // Advanced Payment Features
  const [partialPayments, setPartialPayments] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Reporting & Analytics
  const [showSalesDashboard, setShowSalesDashboard] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Kitchen Operations
  const [courseTiming, setCourseTiming] = useState([]);
  const [prepTimeEstimates, setPrepTimeEstimates] = useState({});
  const [delayedOrders, setDelayedOrders] = useState([]);
  const [showDelayedFiringModal, setShowDelayedFiringModal] = useState(false);

  // Table Management
  const [tableMap, setTableMap] = useState({
    tables: [
      { id: 'T1', capacity: 4, status: 'available', server: null, reservation: null },
      { id: 'T2', capacity: 4, status: 'available', server: null, reservation: null },
      { id: 'T3', capacity: 6, status: 'available', server: null, reservation: null },
      { id: 'T4', capacity: 2, status: 'available', server: null, reservation: null },
      { id: 'T5', capacity: 8, status: 'available', server: null, reservation: null },
      { id: 'T6', capacity: 4, status: 'available', server: null, reservation: null },
    ]
  });
  const [showTableMapModal, setShowTableMapModal] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [waitlist, setWaitlist] = useState([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [turnoverData, setTurnoverData] = useState({});
  const [serviceTimeData, setServiceTimeData] = useState({});
  
  // Staff Management
  const [staff, setStaff] = useState([
    { id: 'S1', name: 'John Doe', role: 'server', permissions: ['order', 'payment'], active: true },
    { id: 'S2', name: 'Jane Smith', role: 'manager', permissions: ['all'], active: true },
    { id: 'S3', name: 'Bob Wilson', role: 'server', permissions: ['order', 'payment'], active: true },
  ]);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [timeClock, setTimeClock] = useState({});
  const [commissions, setCommissions] = useState({});
  const [breaks, setBreaks] = useState([]);
  const [multiTerminalSessions, setMultiTerminalSessions] = useState([]);
  
  // Advanced Order Features
  const [orderSequence, setOrderSequence] = useState([]);
  const [voidReasons, setVoidReasons] = useState([]);
  const [showVoidReasonModal, setShowVoidReasonModal] = useState(false);
  const [managerOverride, setManagerOverride] = useState({ required: false, reason: '', approvedBy: null });
  const [showManagerOverrideModal, setShowManagerOverrideModal] = useState(false);
  const [orderCancellation, setOrderCancellation] = useState({ active: false, reason: '' });
  const [showOrderSequenceModal, setShowOrderSequenceModal] = useState(false);
  const [showOrderCancellationModal, setShowOrderCancellationModal] = useState(false);

  // Item-Level Features
  const [comboMeals, setComboMeals] = useState([]);
  const [sizeVariations, setSizeVariations] = useState({ small: 0.8, medium: 1, large: 1.2 });
  const [addOns, setAddOns] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState('');
  
  // Payment Restrictions
  const [paymentRestrictions, setPaymentRestrictions] = useState({
    minAmount: 0,
    maxAmount: 100000,
    allowedMethods: ['cash', 'razorpay', 'upi', 'gpay', 'phonepay', 'paytm']
  });
  
  const categories = ['All', 'Coffee', 'Food', 'Special', 'Popular'];
  const totalPages = 1;

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const totalGST = (gstEnabled && !taxExempt) ? subTotal * 0.05 : 0; // 5% GST only if enabled and not tax-exempt
      const netAmount = subTotal - billDiscount + totalGST;

      return {
        totalItems,
        totalQty,
        subTotal,
        billDiscount,
        totalGST,
        netAmount,
      };
    } catch (error) {
      console.error('[ClassicOrdersLayout] Cart summary calculation error:', error);
      return {
        totalItems: 0,
        totalQty: 0,
        subTotal: 0,
        billDiscount: 0,
        totalGST: 0,
        netAmount: 0,
      };
    }
  }, [cart.items, gstEnabled, taxExempt]);

  const handleFunctionKeyPress = useCallback((key, action) => {
    try {
      console.log(`Function key ${key} pressed: ${action}`);
      switch (action) {
        case 'clear':
          if (cart?.items?.length > 0 && confirm('Clear cart?')) {
            setCart({ items: [] });
            setSelectedCartItem(null);
            setSearchQuery('');
            setSelectedCustomer(null);
            setSelectedTable(null);
          }
          break;
      case 'exit':
        if (cart.items.length === 0 || confirm('Exit without saving?')) {
          onNavigate?.('dashboard');
        }
        break;
      case 'checkout':
        if (cart.items.length > 0) {
          setShowPaymentModal(true);
        } else {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty!', type: 'warning' });
        }
        break;
      case 'search':
        setSearchQuery('');
        break;
      case 'hold':
        if (cart.items.length > 0) {
          const heldOrder = {
            id: Date.now().toString(),
            items: cart.items,
            summary: cartSummary,
            customer: selectedCustomer,
            table: selectedTable,
            timestamp: new Date().toLocaleString()
          };
          setHeldOrders(prev => [...prev, heldOrder]);
          setCart({ items: [] });
          setSelectedCustomer(null);
          setSelectedTable(null);
          setAlertDialog({ isOpen: true, title: 'Order Held', message: 'Order has been held successfully', type: 'success' });
        }
        break;
      case 'recall':
        setShowOrderHistoryModal(true);
        break;
      case 'discount':
        if (selectedCartItem) {
          setDiscountMode('item');
          const discountPercent = prompt('Enter discount percentage (0-100):', '10');
          if (discountPercent !== null) {
            const discount = parseFloat(discountPercent);
            if (!isNaN(discount) && discount >= 0 && discount <= 100) {
              setCart(prev => ({
                items: prev.items.map(item => {
                  if (item.id === selectedCartItem) {
                    const discountAmount = (item.price * item.qty * discount) / 100;
                    return {
                      ...item,
                      discount: discountAmount,
                      amount: (item.price * item.qty) - discountAmount
                    };
                  }
                  return item;
                })
              }));
              setAlertDialog({ isOpen: true, title: 'Discount Applied', message: `Discount ${discount}% applied to selected item`, type: 'success' });
            }
          }
        } else {
          setDiscountMode('bill');
          const discountPercent = prompt('Enter bill discount percentage (0-100):', '5');
          if (discountPercent !== null) {
            const discount = parseFloat(discountPercent);
            if (!isNaN(discount) && discount >= 0 && discount <= 100) {
              const discountAmount = (cartSummary.subTotal * discount) / 100;
              setCart(prev => ({
                items: prev.items.map(item => ({
                  ...item,
                  discount: (item.discount || 0) + (discountAmount / prev.items.length)
                }))
              }));
              setAlertDialog({ isOpen: true, title: 'Discount Applied', message: `Bill discount ${discount}% applied`, type: 'success' });
            }
          }
        }
        setDiscountMode(null);
        break;
      case 'customer':
        setShowCustomerModal(true);
        break;
      case 'table':
        setShowTablesModal(true);
        break;
      case 'print':
        if (cart.items.length > 0) {
          printReceipt();
        } else {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty!', type: 'warning' });
        }
        break;
      case 'settlement':
        if (confirm('Proceed to settlement?')) {
          setShowAnalyticsModal(true);
        }
        break;
      case 'splitBill':
        if (cart.items.length > 0) {
          setShowSplitBillModal(true);
        } else {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty!', type: 'warning' });
        }
        break;
      case 'voidReason':
        setShowVoidReasonModal(true);
        break;
      case 'orderSequence':
        setShowOrderSequenceModal(true);
        break;
      case 'managerOverride':
        setShowManagerOverrideModal(true);
        break;
      case 'inventory':
        setShowInventoryModal(true);
        break;
      case 'waste_tracking':
        setShowWasteTrackingModal(true);
        break;
      case 'table_map':
        setShowTableMapModal(true);
        break;
      case 'reservations':
        setShowReservationModal(true);
        break;
      case 'waitlist':
        setShowWaitlistModal(true);
        break;
      case 'sales_dashboard':
        setShowSalesDashboard(true);
        break;
      case 'analytics':
        setShowAnalyticsModal(true);
        break;
      case 'delayed_firing':
        setShowDelayedFiringModal(true);
        break;
      case 'staff_management':
        setShowStaffModal(true);
        break;
      case 'shift_management':
        setShowShiftModal(true);
        break;
      case 'dietary_options':
        setShowDietaryModal(true);
        break;
      case 'split_payment':
        setShowDepositModal(true);
        break;
      case 'order_cancellation':
        setShowOrderCancellationModal(true);
        break;
      case 'reports':
        onNavigate?.('analytics');
        break;
      case 'navigate_tables':
        onNavigate?.('tables');
        break;
      case 'navigate_kitchen':
        onNavigate?.('kitchen');
        break;
      case 'navigate_reports':
        onNavigate?.('analytics');
        break;
      case 'navigate_staff':
        onNavigate?.('staff');
        break;
      case 'bill_cancel':
        if (cart.items.length > 0 && confirm('Cancel this bill?')) {
          setCart({ items: [] });
          setSelectedCartItem(null);
          setSelectedCustomer(null);
          setSelectedTable(null);
        }
        break;
      case 'exchange':
        if (cart.items.length === 0) {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Add items to cart for exchange', type: 'warning' });
          return;
        }
        setShowExchangeModal(true);
        break;
      case 'end_refund':
        if (orderHistory.length === 0) {
          setAlertDialog({ isOpen: true, title: 'No Orders', message: 'No completed orders to refund', type: 'warning' });
          return;
        }
        setShowRefundModal(true);
        break;
      case 'price_update':
        if (selectedCartItem) {
          const newPrice = prompt('Enter new price:', '');
          if (newPrice !== null) {
            const price = parseFloat(newPrice);
            if (!isNaN(price) && price >= 0) {
              setCart(prev => ({
                items: prev.items.map(item => {
                  if (item.id === selectedCartItem) {
                    return { ...item, price, amount: price * item.qty };
                  }
                  return item;
                })
              }));
              setAlertDialog({ isOpen: true, title: 'Price Updated', message: `Price updated to ₹${price.toFixed(2)}`, type: 'success' });
            }
          }
        } else {
          setAlertDialog({ isOpen: true, title: 'No Item Selected', message: 'Select an item to update price', type: 'warning' });
        }
        break;
      case 'pay_mode':
        if (cart.items.length > 0) {
          setShowPaymentModal(true);
        } else {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty! Add items before making a payment.', type: 'warning' });
        }
        break;
      case 'day_end':
        if (confirm('End day and close all sessions?')) {
          setShowDayEndReportModal(true);
        }
        break;
      case 'receipt_options':
        setShowReceiptOptionsModal(true);
        break;
      case 'inventory':
        setShowInventoryModal(true);
        break;
      case 'waste_tracking':
        setShowWasteTrackingModal(true);
        break;
      case 'deposit':
        setShowDepositModal(true);
        break;
      case 'sales_dashboard':
        setShowSalesDashboard(true);
        break;
      case 'analytics':
        setShowAnalyticsModal(true);
        break;
      case 'delayed_firing':
        setShowDelayedFiringModal(true);
        break;
      case 'table_map':
        setShowTableMapModal(true);
        break;
      case 'reservations':
        setShowReservationModal(true);
        break;
      case 'waitlist':
        setShowWaitlistModal(true);
        break;
      case 'staff_management':
        setShowStaffModal(true);
        break;
      case 'shift_management':
        setShowShiftModal(true);
        break;
      case 'void_reason':
        setShowVoidReasonModal(true);
        break;
      case 'manager_override':
        setShowManagerOverrideModal(true);
        break;
      case 'dietary_options':
        setShowDietaryModal(true);
        break;
      case 'split_payment':
        if (cart.items.length === 0) {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Add items to cart before splitting payment', type: 'warning' });
          return;
        }
        setShowSplitPaymentModal(true);
        break;
      case 'split_bill':
        if (cart.items.length === 0) {
          setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Add items to cart before splitting bill', type: 'warning' });
          return;
        }
        setShowSplitBillModal(true);
        break;
      case 'table_transfer':
        if (!selectedTable) {
          setAlertDialog({ isOpen: true, title: 'No Table', message: 'Select a table first', type: 'warning' });
          return;
        }
        setShowTableTransferModal(true);
        break;
      case 'order_merge':
        if (orderHistory.length === 0) {
          setAlertDialog({ isOpen: true, title: 'No Orders', message: 'No completed orders to merge', type: 'warning' });
          return;
        }
        setShowOrderMergeModal(true);
        break;
      case 'void_order':
        if (orderHistory.length === 0) {
          setAlertDialog({ isOpen: true, title: 'No Orders', message: 'No completed orders to void', type: 'warning' });
          return;
        }
        setShowVoidOrderModal(true);
        break;
    }
  } catch (error) {
    console.error('[ClassicOrdersLayout] Function key handler error:', error);
  }
  }, [onNavigate, cart.items, cartSummary, selectedCartItem, heldOrders, selectedCustomer, selectedTable]);

  // Prevent browser F-key defaults and trigger POS actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.startsWith('F') && e.key.length === 2) {
        const fNum = parseInt(e.key.substring(1));
        if (fNum >= 1 && fNum <= 12) {
          e.preventDefault();
          
          // Map F-keys to actions
          const actionMap = {
            1: 'search',
            2: 'hold',
            3: 'recall',
            4: 'clear',
            5: 'checkout',
            6: 'discount',
            7: 'customer',
            8: 'table',
            9: 'settlement',
            10: 'splitBill',
            11: 'voidReason',
            12: 'orderSequence',
          };
          
          const action = actionMap[fNum];
          if (action) {
            handleFunctionKeyPress(e.key, action);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFunctionKeyPress]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleMenuItemClick = useCallback((item) => {
    try {
      if (!item) return;
      setCart(prev => {
        const items = prev?.items || [];
        const existing = items.find(i => i.id === item.id);
        if (existing) {
          return { items: items.map(i => i.id === item.id ? { ...i, qty: (i.qty || 0) + 1, amount: (i.price * ((i.qty || 0) + 1)) } : i) };
        }
        return { items: [...items, { ...item, qty: 1, amount: item.price || 0, discount: 0 }] };
      });
    } catch (error) {
      console.error('[ClassicOrdersLayout] Menu item click error:', error);
    }
  }, []);

  const handleCartItemSelect = useCallback((itemId) => {
    setSelectedCartItem(itemId);
    // Pre-fill edit price when selecting an item
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      setEditPriceValue(item.price?.toString() || '0');
    }
  }, [cart.items]);

  const handleEditPriceSave = useCallback(() => {
    if (!selectedCartItem) return;
    
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Price', message: 'Please enter a valid price.', type: 'warning' });
      return;
    }
    
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === selectedCartItem) {
          return { ...item, price: newPrice, amount: newPrice * item.qty };
        }
        return item;
      });
      return { items };
    });
    
    setShowEditPriceModal(false);
  }, [selectedCartItem, editPriceValue]);

  const handleCartItemUpdate = useCallback((itemId, updates) => {
    setCart(prev => {
      const items = prev?.items || [];
      const existing = items.find(i => i.id === itemId);
      if (existing) {
        // Track modification
        setVoidReasons(prevReasons => [...prevReasons, {
          type: 'item_modification',
          itemId,
          oldValue: { qty: existing.qty, price: existing.price },
          newValue: updates,
          timestamp: Date.now(),
          staff: currentStaff?.name || 'Unknown'
        }]);
        return { items: items.map(i => i.id === itemId ? { ...i, ...updates } : i) };
      }
      return prev;
    });
  }, [currentStaff]);

  const handleCartItemDelete = useCallback((itemId) => {
    setCart(prev => {
      const items = prev?.items || [];
      const item = items.find(i => i.id === itemId);
      if (item) {
        // Track deletion
        setVoidReasons(prevReasons => [...prevReasons, {
          type: 'item_deletion',
          itemId,
          itemDetails: item,
          timestamp: Date.now(),
          staff: currentStaff?.name || 'Unknown'
        }]);
      }
      return { items: items.filter(i => i.id !== itemId) };
    });
    if (selectedCartItem === itemId) {
      setSelectedCartItem(null);
    }
  }, [currentStaff, selectedCartItem]);

  const handleCartItemQtyChange = useCallback((itemId, newQty) => {
    setCart(prev => {
      const items = prev.items.map(i => i.id === itemId ? { ...i, qty: newQty, amount: i.price * newQty } : i);
      const item = items.find(i => i.id === itemId);
      // Track quantity change
      setVoidReasons(prevReasons => [...prevReasons, {
        type: 'quantity_change',
        itemId,
        oldQty: item?.qty || 0,
        newQty,
        timestamp: Date.now(),
        staff: currentStaff?.name || 'Unknown'
      }]);
      return { items };
    });
  }, [currentStaff]);

  const handleQuickBarInputChange = useCallback((field, value) => {
    setQuickBarInputs(prev => {
      const updated = { ...prev, [field]: value };
      setFocusedInput(field);
      setKeypadValue(value);
      
      // Auto-calculate amount when qty or price changes
      if (field === 'qty' || field === 'price') {
        const qty = parseFloat(updated.qty) || 0;
        const price = parseFloat(updated.price) || 0;
        updated.amount = (qty * price).toFixed(2);
      }
      
      // Update search query when itemCode changes
      if (field === 'itemCode') {
        setSearchQuery(value);
      }
      
      return updated;
    });
  }, []);

  const handleQuickBarEnter = useCallback(() => {
    console.log('[ClassicOrdersLayout] handleQuickBarEnter called:', quickBarInputs);
    if (quickBarInputs.itemCode || quickBarInputs.description) {
      const newItem = {
        id: quickBarInputs.itemCode || Date.now().toString(),
        code: quickBarInputs.itemCode || 'MANUAL',
        name: quickBarInputs.description || 'Custom Item',
        qty: parseFloat(quickBarInputs.qty) || 1,
        price: parseFloat(quickBarInputs.price) || 0,
        amount: parseFloat(quickBarInputs.amount) || 0,
        discount: 0,
      };
      
      console.log('[ClassicOrdersLayout] Adding item to cart:', newItem);
      
      setCart(prev => {
        const items = [...prev.items, { ...newItem, amount: newItem.qty * newItem.price }];
        console.log('[ClassicOrdersLayout] Updated cart items:', items);
        return { items };
      });

      // Reset inputs
      setQuickBarInputs({
        itemCode: '',
        description: '',
        qty: '1',
        price: '0.00',
        amount: '0.00',
        salesmanId: quickBarInputs.salesmanId,
      });
    } else {
      console.log('[ClassicOrdersLayout] No item code or description, skipping');
    }
  }, [quickBarInputs]);

  const handlePaymentSuccess = useCallback((paymentData) => {
    const orderId = currentOrderId || `ORD-${Date.now().toString().slice(-8)}`;
    const completedOrder = {
      id: orderId,
      receiptNumber: `RCP${Date.now().toString().slice(-8)}`,
      orderNumber: orderId,
      items: cart.items,
      total: cartSummary.netAmount,
      customer: selectedCustomer,
      table: selectedTable,
      paymentMethod: paymentData.method || 'card',
      status: 'completed',
      timestamp: new Date().toLocaleString(),
      source: orderType === 'table' ? 'TABLE' : 'WALK_IN',
    };
    setOrderHistory(prev => [completedOrder, ...prev]);
    
    // Automatic stock deduction on order completion
    handleStockDeduction(cart.items);
    
    // Add to KDS for kitchen display
    try {
      const kdsTicket = {
        id: `KDS-${Date.now()}`,
        orderId: completedOrder.id,
        source: completedOrder.source,
        station: kitchenStation,
        status: 'NEW',
        items: cart.items.map(item => ({ 
          name: item.name, 
          qty: item.qty, 
          mod: item.modifications || '' 
        })),
        note: orderNotes || '',
        startedAt: Date.now(),
        urgency: 'urgent',
        tableNumber: selectedTable || null,
      };
      const existingKds = JSON.parse(localStorage.getItem('kdsTickets') || '[]');
      localStorage.setItem('kdsTickets', JSON.stringify([kdsTicket, ...existingKds]));
    } catch (error) {
      console.error('[ClassicOrdersLayout] KDS error:', error);
    }
    
    // Clear cart
    setCart({ items: [] });
    setSelectedCustomer(null);
    setSelectedTable(null);
    setOrderNotes('');
    setCurrentOrderId(null);
  }, [currentOrderId, cart, cartSummary, selectedCustomer, selectedTable, orderType, kitchenStation, orderNotes]);

  const handlePaymentClick = useCallback((type) => {
    console.log('[ClassicOrdersLayout] Payment clicked:', type);
    console.log('[ClassicOrdersLayout] Cart items:', cart.items.length);
    console.log('[ClassicOrdersLayout] Cart summary:', cartSummary);
    
    if (cart.items.length === 0) {
      console.log('[ClassicOrdersLayout] Cart is empty, showing alert');
      setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty! Add items before making a payment.', type: 'warning' });
      return;
    }

    // Check payment method restrictions
    if (!paymentRestrictions.allowedMethods.includes(type)) {
      setAlertDialog({ isOpen: true, title: 'Payment Method Not Allowed', message: `${type.toUpperCase()} is not an allowed payment method`, type: 'warning' });
      return;
    }

    // Check min/max amount restrictions
    if (cartSummary.netAmount < paymentRestrictions.minAmount) {
      setAlertDialog({ isOpen: true, title: 'Minimum Amount Required', message: `Minimum payment amount is ₹${paymentRestrictions.minAmount}`, type: 'warning' });
      return;
    }
    if (cartSummary.netAmount > paymentRestrictions.maxAmount) {
      setAlertDialog({ isOpen: true, title: 'Maximum Amount Exceeded', message: `Maximum payment amount is ₹${paymentRestrictions.maxAmount}`, type: 'warning' });
      return;
    }

    // Check for partial payments
    const totalPaid = partialPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = cartSummary.netAmount - totalPaid;

    if (remainingAmount <= 0) {
      setAlertDialog({ isOpen: true, title: 'Already Paid', message: 'Order has been fully paid', type: 'warning' });
      return;
    }

    // Generate stable order ID when opening payment modal
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    setCurrentOrderId(orderId);

    // Handle cash payment directly without opening modal
    if (type === 'cash') {
      console.log('[ClassicOrdersLayout] Cash payment - completing directly');
      const completedOrder = {
        id: orderId,
        receiptNumber: `RCP${Date.now().toString().slice(-8)}`,
        orderNumber: orderId,
        items: cart.items,
        total: cartSummary.netAmount,
        customer: selectedCustomer,
        table: selectedTable,
        paymentMethod: 'cash',
        status: 'completed',
        timestamp: new Date().toLocaleString(),
        source: orderType === 'table' ? 'TABLE' : 'WALK_IN',
      };
      setOrderHistory(prev => [completedOrder, ...prev]);
      
      // Automatic stock deduction on order completion
      handleStockDeduction(cart.items);
      
      // Add to KDS for kitchen display
      try {
        const kdsTicket = {
          id: `KDS-${Date.now()}`,
          orderId: completedOrder.id,
          source: completedOrder.source,
          station: kitchenStation,
          status: 'NEW',
          items: cart.items.map(item => ({ 
            name: item.name, 
            qty: item.qty, 
            mod: item.modifications || '' 
          })),
          note: orderNotes || '',
          startedAt: Date.now(),
          urgency: 'urgent',
          tableNumber: selectedTable || null,
          createdAt: Date.now()
        };     
        const existingKds = JSON.parse(localStorage.getItem('cafeos_kdsCards') || '[]');
        localStorage.setItem('cafeos_kdsCards', JSON.stringify([kdsTicket, ...existingKds]));
          
        // Also add to orders for tables display
        const existingOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
        localStorage.setItem('cafeos_orders', JSON.stringify([completedOrder, ...existingOrders]));
          
        console.log('[ClassicOrdersLayout] Order added to KDS and orders storage');
      } catch (error) {
        console.error('[ClassicOrdersLayout] Failed to add to KDS/orders:', error);
      }
      
      setCart({ items: [] });
      setSelectedCartItem(null);
      setSelectedCustomer(null);
      setSelectedTable(null);
      setAlertDialog({ 
        isOpen: true, 
        title: 'Payment Completed', 
        message: `Cash payment of ₹${cartSummary.netAmount.toFixed(2)} completed successfully`, 
        type: 'success' 
      });
      return;
    }

    console.log('[ClassicOrdersLayout] Opening PaymentModal with payment type:', type);
    // For non-cash payments, open PaymentModal with the selected method
    setSelectedPaymentMethod(type);
    setShowPaymentModal(true);
  }, [cart.items, cartSummary, selectedCustomer, selectedTable, orderType]);

  const handleKeypadChange = useCallback((value) => {
    if (value === 'C') {
      setKeypadValue('');
      setQuickBarInputs(prev => ({ ...prev, [focusedInput]: '' }));
    } else if (value === 'Enter') {
      handleQuickBarEnter();
      setKeypadValue('');
    } else {
      const newValue = (keypadValue + value).slice(0, 10);
      setKeypadValue(newValue);
      setQuickBarInputs(prev => ({ ...prev, [focusedInput]: newValue }));
    }
  }, [keypadValue, focusedInput, handleQuickBarEnter]);

  const handleKeypadEnter = useCallback((value) => {
    handleQuickBarEnter();
    setKeypadValue('');
  }, [handleQuickBarEnter]);

  const handleKeypadClear = useCallback(() => {
    setKeypadValue('');
  }, []);

  const printReceipt = useCallback(() => {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Semi Cafe</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 5mm;
              color: #000;
              background: #fff;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .item-name {
              flex: 1;
            }
            .item-qty {
              text-align: right;
            }
            .item-price {
              text-align: right;
              width: 50px;
            }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">SEMI CAFE</div>
          <div class="divider"></div>
          <div>Terminal: HQ-PC01</div>
          <div>Date: ${new Date().toLocaleString()}</div>
          <div>Customer: ${selectedCustomer || 'Walk-in'}</div>
          <div>Table: ${selectedTable || 'N/A'}</div>
          <div>Salesman: ${quickBarInputs.salesmanId || 'N/A'}</div>
          <div class="divider"></div>
          ${cart.items.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">${item.qty}x</span>
              <span class="item-price">₹${item.amount.toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="item">
            <span>Subtotal:</span>
            <span>₹${cartSummary.subTotal.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Discount:</span>
            <span>-₹${cartSummary.billDiscount.toFixed(2)}</span>
          </div>
          ${gstEnabled ? `
          <div class="item">
            <span>GST (5%):</span>
            <span>₹${cartSummary.totalGST.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="total">NET: ₹${cartSummary.netAmount.toFixed(2)}</div>
          <div class="divider"></div>
          <div class="footer">Thank you for dining with us!</div>
        </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.write(receiptContent);
    iframeDoc.close();

    iframe.contentWindow.print();

    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, [cart.items, cartSummary, selectedCustomer, selectedTable, gstEnabled]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer.name || customer);
    setShowCustomerModal(false);
  }, []);

  const handleSelectTable = useCallback((table) => {
    setSelectedTable(table.number);
    setShowTablesModal(false);
  }, []);

  const handleRecallOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
    setSelectedTable(heldOrder.table);
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
    setShowHeldOrdersModal(false);
  }, []);

  const handleRecallHistoryOrder = useCallback((historyOrder) => {
    setCart({ items: historyOrder.items || [] });
    setSelectedCustomer(historyOrder.customer);
    setSelectedTable(historyOrder.table);
    setShowOrderHistoryModal(false);
    setAlertDialog({ 
      isOpen: true, 
      title: 'Order Recalled', 
      message: 'Order has been recalled from history', 
      type: 'success' 
    });
  }, []);

  const handlePrintHistoryOrder = useCallback((historyOrder) => {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Semi Cafe</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 5mm;
              color: #000;
              background: #fff;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .total {
              font-weight: bold;
              text-align: right;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">SEMI CAFE</div>
          <div class="divider"></div>
          <div>Order #: ${historyOrder.orderNumber}</div>
          <div>Date: ${historyOrder.timestamp}</div>
          <div class="divider"></div>
          ${historyOrder.items?.map(item => `
            <div class="item">
              <span>${item.name} x${item.qty}</span>
              <span>₹${(item.price * item.qty).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="total">Total: ₹${historyOrder.total?.toFixed(2)}</div>
          <div class="divider"></div>
          <div>Payment: ${historyOrder.paymentMethod?.toUpperCase()}</div>
          <div>Thank you for dining with us!</div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  }, []);

  const handleItemModification = useCallback((itemId, modifications) => {
    setCart(prev => ({
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, modifications };
        }
        return item;
      })
    }));
    setShowItemModificationsModal(false);
  }, []);

  const handleVoidOrder = useCallback((orderId, reason) => {
    setOrderHistory(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, status: 'voided', voidReason: reason, voidedAt: new Date().toLocaleString() };
      }
      return order;
    }));
    setShowVoidOrderModal(false);
    setAlertDialog({ isOpen: true, title: 'Order Voided', message: `Order ${orderId} has been voided`, type: 'success' });
  }, []);

  const handleRefund = useCallback((orderId, refundAmount, reason) => {
    const order = orderHistory.find(o => o.id === orderId);
    if (order) {
      const refundedOrder = {
        ...order,
        originalOrderId: orderId,
        refundAmount,
        refundReason: reason,
        refundDate: new Date().toLocaleString(),
        status: 'refunded'
      };
      setOrderHistory(prev => [refundedOrder, ...prev]);
      setShowRefundModal(false);
      setAlertDialog({ isOpen: true, title: 'Refund Processed', message: `Refund of ₹${refundAmount.toFixed(2)} processed for order ${orderId}`, type: 'success' });
    }
  }, [orderHistory]);

  const handleExchange = useCallback((originalOrderId, newItems) => {
    const originalOrder = orderHistory.find(o => o.id === originalOrderId);
    if (originalOrder) {
      const exchangeOrder = {
        id: `EXC-${Date.now().toString().slice(-8)}`,
        originalOrderId,
        items: newItems,
        originalItems: originalOrder.items,
        status: 'exchanged',
        timestamp: new Date().toLocaleString(),
        source: 'EXCHANGE'
      };
      setOrderHistory(prev => [exchangeOrder, ...prev]);
      setShowExchangeModal(false);
      setCart({ items: [] });
      setAlertDialog({ isOpen: true, title: 'Exchange Complete', message: 'Exchange has been processed', type: 'success' });
    }
  }, [orderHistory]);

  const handleTableTransfer = useCallback((fromTable, toTable) => {
    setSelectedTable(toTable);
    setShowTableTransferModal(false);
    setAlertDialog({ isOpen: true, title: 'Table Transferred', message: `Order transferred from ${fromTable} to ${toTable}`, type: 'success' });
  }, []);

  const handleOrderMerge = useCallback((targetOrderId) => {
    const targetOrder = orderHistory.find(o => o.id === targetOrderId);
    if (targetOrder) {
      const mergedItems = [...targetOrder.items, ...cart.items];
      setCart({ items: mergedItems });
      setShowOrderMergeModal(false);
      setAlertDialog({ isOpen: true, title: 'Orders Merged', message: `Order merged with ${targetOrderId}`, type: 'success' });
    }
  }, [orderHistory, cart.items]);

  const handleReceiptOptionsChange = useCallback((key, value) => {
    setReceiptOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const [dayEndReport, setDayEndReport] = useState(null);

  const handleDayEndReport = useCallback(() => {
    const todayOrders = orderHistory.filter(order => {
      const orderDate = new Date(order.timestamp);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    });

    const totalSales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = todayOrders.length;
    const paymentMethods = todayOrders.reduce((acc, order) => {
      const method = order.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + (order.total || 0);
      return acc;
    }, {});

    setDayEndReport({
      date: new Date().toLocaleDateString(),
      totalSales,
      totalOrders,
      paymentMethods,
      orders: todayOrders
    });
    setShowDayEndReportModal(false);
    setAlertDialog({ 
      isOpen: true, 
      title: 'Day End Report Generated', 
      message: `Total Sales: ₹${totalSales.toFixed(2)} | Orders: ${totalOrders}`, 
      type: 'success' 
    });
  }, [orderHistory]);

  // Inventory Handlers
  const handleStockDeduction = useCallback((items) => {
    setInventory(prev => {
      const updatedItems = { ...prev.items };
      items.forEach(item => {
        const itemId = item.id || item.name;
        if (updatedItems[itemId]) {
          updatedItems[itemId].quantity -= item.qty;
          if (updatedItems[itemId].quantity <= prev.lowStockThreshold) {
            setAllergyAlerts(prev => [...prev, { type: 'low_stock', item: itemId, quantity: updatedItems[itemId].quantity }]);
          }
        }
      });
      return { ...prev, items: updatedItems };
    });
  }, [inventory.lowStockThreshold]);

  const handleWasteTracking = useCallback((itemId, quantity, reason) => {
    if (!itemId || !inventory.items[itemId]) {
      setAlertDialog({ isOpen: true, title: 'Invalid Item', message: 'Please select a valid item', type: 'warning' });
      return;
    }
    if (!quantity || quantity <= 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Quantity', message: 'Quantity must be greater than 0', type: 'warning' });
      return;
    }
    if (!reason) {
      setAlertDialog({ isOpen: true, title: 'Missing Reason', message: 'Please enter a reason for waste', type: 'warning' });
      return;
    }
    setInventory(prev => {
      const updatedItems = { ...prev.items };
      if (updatedItems[itemId]) {
        updatedItems[itemId].quantity -= quantity;
        updatedItems[itemId].waste = (updatedItems[itemId].waste || 0) + quantity;
      }
      return { ...prev, items: updatedItems };
    });
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'waste', 
      itemId, 
      quantity, 
      reason, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setWasteRecords(prev => [...prev, { itemId, quantity, reason, timestamp: Date.now() }]);
    setShowWasteTrackingModal(false);
    setAlertDialog({ isOpen: true, title: 'Waste Recorded', message: `Waste of ${quantity} units recorded for ${itemId}`, type: 'success' });
  }, [currentStaff, inventory.items]);

  const handleInventoryTransfer = useCallback((itemId, fromLocation, toLocation, quantity) => {
    setInventory(prev => {
      const updatedItems = { ...prev.items };
      if (updatedItems[itemId]) {
        const locationKey = `${fromLocation}_${itemId}`;
        if (!updatedItems[itemId].locations) {
          updatedItems[itemId].locations = {};
        }
        if (!updatedItems[itemId].locations[fromLocation]) {
          updatedItems[itemId].locations[fromLocation] = 0;
        }
        if (!updatedItems[itemId].locations[toLocation]) {
          updatedItems[itemId].locations[toLocation] = 0;
        }
        
        if (updatedItems[itemId].locations[fromLocation] >= quantity) {
          updatedItems[itemId].locations[fromLocation] -= quantity;
          updatedItems[itemId].locations[toLocation] += quantity;
        } else {
          setAlertDialog({ isOpen: true, title: 'Transfer Failed', message: 'Insufficient stock in source location', type: 'warning' });
          return prev;
        }
      }
      return { ...prev, items: updatedItems };
    });
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'inventory_transfer', 
      itemId, 
      fromLocation, 
      toLocation, 
      quantity, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setAlertDialog({ isOpen: true, title: 'Transfer Complete', message: `Inventory transferred successfully`, type: 'success' });
  }, [currentStaff]);

  // Payment Handlers
  const handleDeposit = useCallback((amount) => {
    if (amount > cartSummary.netAmount) {
      setAlertDialog({ isOpen: true, title: 'Invalid Amount', message: 'Deposit cannot exceed total amount', type: 'warning' });
      return;
    }
    setDepositAmount(amount);
    setPartialPayments(prev => [...prev, { type: 'deposit', amount, timestamp: Date.now() }]);
    setShowDepositModal(false);
    setAlertDialog({ isOpen: true, title: 'Deposit Recorded', message: `Deposit of ₹${amount.toFixed(2)} recorded. Remaining: ₹${(cartSummary.netAmount - amount).toFixed(2)}`, type: 'success' });
  }, [cartSummary.netAmount]);

  // Analytics Handlers
  const handleGenerateAnalytics = useCallback(() => {
    if (!orderHistory || orderHistory.length === 0) {
      setAlertDialog({ isOpen: true, title: 'No Data', message: 'No order history available for analytics', type: 'warning' });
      return;
    }

    const todayOrders = orderHistory.filter(order => {
      if (!order.timestamp) return false;
      const orderDate = new Date(order.timestamp);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    });

    if (todayOrders.length === 0) {
      setAnalyticsData({
        itemPerformance: {},
        hourlySales: {},
        staffPerformance: {},
        totalOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        profitMargin: 0,
        totalTax: 0,
        orders: []
      });
      return;
    }

    const itemPerformance = {};
    todayOrders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const itemName = item.name;
        if (!itemName) return;
        if (!itemPerformance[itemName]) {
          itemPerformance[itemName] = { quantity: 0, revenue: 0, cost: 0 };
        }
        itemPerformance[itemName].quantity += item.qty || 0;
        itemPerformance[itemName].revenue += item.amount || 0;
        const itemCost = inventory.items?.[itemName]?.cost || (item.price || 0) * 0.6;
        itemPerformance[itemName].cost += itemCost * (item.qty || 0);
      });
    });

    const hourlySales = {};
    todayOrders.forEach(order => {
      try {
        const hour = new Date(order.timestamp).getHours();
        if (!hourlySales[hour]) hourlySales[hour] = 0;
        hourlySales[hour] += order.total || 0;
      } catch (e) {
        console.error('Error parsing timestamp for hourly sales:', e);
      }
    });

    // Staff performance tracking
    const staffPerformance = {};
    todayOrders.forEach(order => {
      if (order.server) {
        if (!staffPerformance[order.server]) {
          staffPerformance[order.server] = { orders: 0, revenue: 0 };
        }
        staffPerformance[order.server].orders += 1;
        staffPerformance[order.server].revenue += order.total || 0;
      }
    });

    // Profit margin analysis
    const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCost = Object.values(itemPerformance).reduce((sum, item) => sum + (item.cost || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    // Tax reporting
    const totalTax = todayOrders.reduce((sum, o) => sum + (o.tax || 0), 0);

    setAnalyticsData({
      itemPerformance,
      hourlySales,
      staffPerformance,
      totalOrders: todayOrders.length,
      totalRevenue,
      totalCost,
      profitMargin,
      totalTax,
      orders: todayOrders
    });
  }, [orderHistory, inventory.items]);

  // Kitchen Operations - Chef notes and allergy alerts integration
  useEffect(() => {
    // Check for allergy alerts from dietary restrictions
    if (dietaryRestrictions.length > 0) {
      const latest = dietaryRestrictions[dietaryRestrictions.length - 1];
      if (latest.allergies) {
        const allergyList = latest.allergies.split(',').map(a => a.trim());
        allergyList.forEach(allergy => {
          setAllergyAlerts(prev => [...prev, {
            type: 'allergy',
            allergy,
            timestamp: Date.now(),
            order: currentOrderId
          }]);
        });
      }
    }
  }, [dietaryRestrictions, currentOrderId]);

  // Chef notes handler
  const handleChefNotes = useCallback((itemId, notes) => {
    setCart(prev => ({
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, chefNotes: notes } : item
      )
    }));
    // Add to audit trail
    setVoidReasons(prev => [...prev, {
      type: 'chef_notes',
      itemId,
      notes,
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
  }, [currentStaff]);

  // Prep time estimation
  const handlePrepTimeUpdate = useCallback((itemId, prepMinutes) => {
    setPrepTimeEstimates(prev => ({
      ...prev,
      [itemId]: prepMinutes
    }));
  }, []);

  // Course timing management
  const handleCourseTiming = useCallback((orderId, course, delayMinutes) => {
    setCourseTiming(prev => [...prev, {
      orderId,
      course,
      scheduledTime: Date.now() + (delayMinutes * 60 * 1000),
      timestamp: Date.now()
    }]);
  }, []);

  // KDS routing improvements
  const handleKDSRouting = useCallback((itemId, station) => {
    setPrepTimeEstimates(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], station }
    }));
  }, []);

  // Turnover rate tracking
  const handleTurnoverTracking = useCallback((tableId, startTime, endTime) => {
    const duration = endTime - startTime;
    setTurnoverData(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        lastTurnoverTime: duration,
        averageTurnover: prev[tableId]?.averageTurnover 
          ? (prev[tableId].averageTurnover + duration) / 2 
          : duration,
        turnoverCount: (prev[tableId]?.turnoverCount || 0) + 1
      }
    }));
  }, []);

  // Service time tracking
  const handleServiceTimeStart = useCallback((orderId, tableId) => {
    setServiceTimeData(prev => ({
      ...prev,
      [orderId]: { startTime: Date.now(), tableId }
    }));
  }, []);

  const handleServiceTimeEnd = useCallback((orderId) => {
    setServiceTimeData(prev => {
      const order = prev[orderId];
      if (order) {
        const duration = Date.now() - order.startTime;
        return {
          ...prev,
          [orderId]: { ...order, endTime: Date.now(), duration }
        };
      }
      return prev;
    });
  }, []);

  // Shift scheduling
  const handleShiftCreate = useCallback((staffId, startTime, endTime, role) => {
    setShifts(prev => [...prev, {
      id: Date.now(),
      staffId,
      startTime,
      endTime,
      role,
      status: 'scheduled'
    }]);
  }, []);

  // Commission tracking
  const handleCommissionCalculation = useCallback((staffId, orderAmount, commissionRate) => {
    const commission = orderAmount * (commissionRate / 100);
    setCommissions(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        totalCommission: (prev[staffId]?.totalCommission || 0) + commission,
        orders: (prev[staffId]?.orders || 0) + 1
      }
    }));
  }, []);

  // Break management
  const handleBreakStart = useCallback((staffId) => {
    setBreaks(prev => [...prev, {
      staffId,
      startTime: Date.now(),
      status: 'on_break'
    }]);
  }, []);

  const handleBreakEnd = useCallback((staffId) => {
    setBreaks(prev => prev.map(b => 
      b.staffId === staffId && b.status === 'on_break'
        ? { ...b, endTime: Date.now(), status: 'completed' }
        : b
    ));
  }, []);

  // Order sequencing and queuing
  const handleOrderSequence = useCallback((priority) => {
    if (!currentOrderId) {
      setAlertDialog({ isOpen: true, title: 'No Active Order', message: 'Please start an order first', type: 'warning' });
      return;
    }
    setOrderSequence(prev => [...prev, {
      orderId: currentOrderId,
      priority,
      timestamp: Date.now(),
      sequenceNumber: prev.length + 1
    }]);
    setShowOrderSequenceModal(false);
    setAlertDialog({ isOpen: true, title: 'Order Queued', message: `Order queued with priority: ${priority}`, type: 'success' });
  }, [currentOrderId]);

  // Custom report generation
  const handleGenerateCustomReport = useCallback((dateRange, metrics) => {
    const filteredOrders = orderHistory.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });

    const reportData = {};
    metrics.forEach(metric => {
      if (metric === 'revenue') {
        reportData.revenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      }
      if (metric === 'orders') {
        reportData.orders = filteredOrders.length;
      }
      if (metric === 'items') {
        reportData.items = filteredOrders.reduce((sum, o) => sum + o.items.length, 0);
      }
    });

    return reportData;
  }, [orderHistory]);

  // Combo meal construction
  const handleComboMeal = useCallback((name, items, price) => {
    setComboMeals(prev => [...prev, {
      id: `COMBO-${Date.now()}`,
      name,
      items,
      price,
      timestamp: Date.now()
    }]);
  }, []);

  // Size variations
  const handleSizeVariation = useCallback((itemId, size, multiplier) => {
    setSizeVariations(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [size]: multiplier }
    }));
  }, []);

  // Add-ons and extras
  const handleAddOn = useCallback((itemId, addOn) => {
    setAddOns(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), addOn]
    }));
  }, []);

  // Substitutions
  const handleSubstitution = useCallback((itemId, originalItem, substituteItem) => {
    setSubstitutions(prev => ({
      ...prev,
      [itemId]: { originalItem, substituteItem }
    }));
  }, []);

  // Performance bonuses
  const handlePerformanceBonus = useCallback((staffId, amount, reason) => {
    setCommissions(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        bonuses: [...(prev[staffId]?.bonuses || []), { amount, reason, timestamp: Date.now() }]
      }
    }));
  }, []);

  // Multi-terminal staff login
  const handleMultiTerminalLogin = useCallback((staffId, terminalId) => {
    setMultiTerminalSessions(prev => [...prev, { staffId, terminalId, loginTime: Date.now() }]);
  }, []);

  // Integration hooks (for external systems)
  const handleAccountingExport = useCallback((orderData) => {
    console.log('[Accounting Integration] Exporting order:', orderData);
    // Placeholder for accounting software integration
    return { success: true, exportedAt: Date.now() };
  }, []);

  const handleOnlineOrderSync = useCallback((externalOrderId, status) => {
    console.log('[Online Ordering] Syncing order:', externalOrderId, status);
    // Placeholder for online ordering platform sync
    return { success: true, syncedAt: Date.now() };
  }, []);

  const handleDeliveryTracking = useCallback((orderId, trackingInfo) => {
    console.log('[Delivery Tracking] Updating:', orderId, trackingInfo);
    // Placeholder for delivery tracking integration
    return { success: true, updatedAt: Date.now() };
  }, []);

  const handleThirdPartyDelivery = useCallback((platform, orderData) => {
    console.log('[Third Party Delivery] Sending to:', platform, orderData);
    // Placeholder for third-party delivery platform integration
    return { success: true, sentAt: Date.now() };
  }, []);

  // Order cancellation workflow
  const handleOrderCancellation = useCallback((orderId, reason) => {
    if (!orderId) {
      setAlertDialog({ isOpen: true, title: 'Invalid Order', message: 'Please select a valid order to cancel', type: 'warning' });
      return;
    }
    if (!reason) {
      setAlertDialog({ isOpen: true, title: 'Missing Reason', message: 'Please enter a reason for cancellation', type: 'warning' });
      return;
    }
    setOrderCancellation({ active: true, reason, orderId, timestamp: Date.now() });
    // Add to audit trail
    setVoidReasons(prev => [...prev, {
      type: 'order_cancellation',
      orderId,
      reason,
      timestamp: Date.now(),
      requestedBy: currentStaff?.name || 'Unknown'
    }]);
    setShowOrderCancellationModal(false);
    setAlertDialog({ isOpen: true, title: 'Order Cancelled', message: `Order ${orderId} has been cancelled`, type: 'success' });
  }, [currentStaff]);

  const handleDelayedFiring = useCallback((orderId, delayMinutes) => {
    if (!orderId) {
      setAlertDialog({ isOpen: true, title: 'No Active Order', message: 'Please start an order first', type: 'warning' });
      return;
    }
    const fireTime = Date.now() + (delayMinutes * 60 * 1000);
    setDelayedOrders(prev => [...prev, { orderId, fireTime }]);
    setShowDelayedFiringModal(false);
    setAlertDialog({ isOpen: true, title: 'Delayed Firing Set', message: `Order will fire in ${delayMinutes} minutes`, type: 'success' });
  }, []);

  // Table Handlers
  const handleTableReservation = useCallback((tableId, customerName, time, partySize) => {
    setReservations(prev => [...prev, { tableId, customerName, time, partySize, id: Date.now() }]);
    setTableMap(prev => ({
      ...prev,
      tables: prev.tables.map(t => 
        t.id === tableId ? { ...t, status: 'reserved', reservation: customerName } : t
      )
    }));
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'reservation', 
      tableId, 
      customerName, 
      time, 
      partySize, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setShowReservationModal(false);
  }, [currentStaff]);

  const handleTableMerge = useCallback((tableIds, targetTableId) => {
    setTableMap(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (tableIds.includes(t.id)) {
          return { ...t, status: 'occupied', mergedInto: targetTableId };
        }
        if (t.id === targetTableId) {
          const mergedTables = tableIds.filter(id => id !== targetTableId);
          const totalCapacity = t.capacity + mergedTables.reduce((sum, id) => {
            const found = prev.tables.find(table => table.id === id);
            return sum + (found?.capacity || 0);
          }, 0);
          return { ...t, status: 'occupied', capacity: totalCapacity, mergedFrom: mergedTables };
        }
        return t;
      })
    }));
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'table_merge', 
      tableIds, 
      targetTableId, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setAlertDialog({ isOpen: true, title: 'Tables Merged', message: `Tables merged into ${targetTableId}`, type: 'success' });
  }, [currentStaff]);

  const handleTableSplit = useCallback((tableId, splitCount) => {
    setTableMap(prev => {
      const table = prev.tables.find(t => t.id === tableId);
      if (!table) return prev;
      
      const newCapacity = Math.floor(table.capacity / splitCount);
      const newTables = [];
      
      for (let i = 0; i < splitCount; i++) {
        newTables.push({
          id: `${tableId}-${i + 1}`,
          capacity: newCapacity,
          status: 'available',
          server: null,
          reservation: null,
          splitFrom: tableId
        });
      }
      
      return {
        ...prev,
        tables: prev.tables.filter(t => t.id !== tableId).concat(newTables)
      };
    });
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'table_split', 
      tableId, 
      splitCount, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setAlertDialog({ isOpen: true, title: 'Table Split', message: `Table split into ${splitCount} parts`, type: 'success' });
  }, [currentStaff]);

  const handleWaitlistAdd = useCallback((customerName, partySize, phone) => {
    setWaitlist(prev => [...prev, { customerName, partySize, phone, id: Date.now(), addedAt: Date.now() }]);
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'waitlist_add', 
      customerName, 
      partySize, 
      phone, 
      timestamp: Date.now(),
      staff: currentStaff?.name || 'Unknown'
    }]);
    setShowWaitlistModal(false);
  }, [currentStaff]);

  // Staff Handlers
  const handleStaffLogin = useCallback((staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember) {
      setCurrentStaff(staffMember);
      setTimeClock(prev => ({ ...prev, [staffId]: { loginTime: Date.now() } }));
      // Add to audit trail
      setVoidReasons(prev => [...prev, { 
        type: 'staff_login', 
        staffId, 
        staffName: staffMember.name, 
        timestamp: Date.now()
      }]);
    }
  }, [staff]);

  const handleStaffLogout = useCallback(() => {
    if (currentStaff) {
      setTimeClock(prev => ({
        ...prev,
        [currentStaff.id]: { ...prev[currentStaff.id], logoutTime: Date.now() }
      }));
      // Add to audit trail
      setVoidReasons(prev => [...prev, { 
        type: 'staff_logout', 
        staffId: currentStaff.id, 
        staffName: currentStaff.name, 
        timestamp: Date.now()
      }]);
      setCurrentStaff(null);
    }
  }, [currentStaff]);

  // Manager Override Handler
  const handleManagerOverride = useCallback((reason, managerId) => {
    const manager = staff.find(s => s.id === managerId);
    setManagerOverride({ required: false, reason, approvedBy: managerId, approvedByName: manager?.name });
    // Add to audit trail
    setVoidReasons(prev => [...prev, { 
      type: 'manager_override', 
      reason, 
      managerId, 
      managerName: manager?.name, 
      timestamp: Date.now(),
      requestedBy: currentStaff?.name || 'Unknown'
    }]);
    setShowManagerOverrideModal(false);
    setAlertDialog({ isOpen: true, title: 'Override Approved', message: `Manager override approved by ${manager?.name}`, type: 'success' });
  }, [staff, currentStaff]);

  const handleSplitBill = useCallback((splitCount) => {
    if (cart.items.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty - cannot split bill', type: 'warning' });
      return;
    }
    if (!splitCount || splitCount <= 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Split', message: 'Split count must be greater than 0', type: 'warning' });
      return;
    }
    const total = cartSummary.netAmount;
    const perPerson = total / splitCount;
    setAlertDialog({ 
      isOpen: true, 
      title: 'Bill Split Successfully', 
      message: `Split into ${splitCount} parts. Each person pays: ₹${perPerson.toFixed(2)}`, 
      type: 'success' 
    });
    setShowSplitBillModal(false);
  }, [cartSummary.netAmount, cart.items.length]);

  const handleSplitBillByAmount = useCallback((amounts) => {
    if (cart.items.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty - cannot split bill', type: 'warning' });
      return;
    }
    if (!amounts || amounts.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter at least one amount', type: 'warning' });
      return;
    }
    const total = amounts.reduce((sum, a) => sum + a, 0);
    if (Math.abs(total - cartSummary.netAmount) > 0.01) {
      setAlertDialog({ 
        isOpen: true, 
        title: 'Amount Mismatch', 
        message: `Split amounts (₹${total.toFixed(2)}) do not match total (₹${cartSummary.netAmount.toFixed(2)})`, 
        type: 'warning' 
      });
      return;
    }
    setAlertDialog({ 
      isOpen: true, 
      title: 'Bill Split Successfully', 
      message: `Split by amounts: ${amounts.map(a => `₹${a.toFixed(2)}`).join(', ')}`, 
      type: 'success' 
    });
    setShowSplitBillModal(false);
  }, [cartSummary.netAmount, cart.items.length]);

  const handleSplitBillByItem = useCallback((itemAssignments) => {
    if (cart.items.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty - cannot split bill', type: 'warning' });
      return;
    }
    if (!itemAssignments || itemAssignments.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'No item assignments provided', type: 'warning' });
      return;
    }
    const personTotals = {};
    itemAssignments.forEach(({ itemId, person }) => {
      const item = cart.items.find(i => i.id === itemId);
      if (item) {
        if (!personTotals[person]) personTotals[person] = 0;
        personTotals[person] += item.amount;
      }
    });
    if (Object.keys(personTotals).length === 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Assignment', message: 'No valid items assigned', type: 'warning' });
      return;
    }
    setSplitPayments(Object.entries(personTotals).map(([person, amount]) => ({ 
      person, 
      amount, 
      timestamp: Date.now() 
    })));
    setShowSplitBillModal(false);
    setAlertDialog({ 
      isOpen: true, 
      title: 'Bill Split Successfully', 
      message: `Split by items: ${Object.entries(personTotals).map(([p, a]) => `Person ${p}: ₹${a.toFixed(2)}`).join(', ')}`, 
      type: 'success' 
    });
  }, [cart.items]);

  const handleSplitPayment = useCallback((paymentMethod, amount) => {
    if (cart.items.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty - cannot process payment', type: 'warning' });
      return;
    }
    if (!paymentMethod || !amount || amount <= 0) {
      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter valid payment method and amount', type: 'warning' });
      return;
    }
    setSplitPayments(prev => [...prev, { method: paymentMethod, amount }]);
    const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const remaining = cartSummary.netAmount - totalPaid;
    
    if (remaining <= 0) {
      setAlertDialog({ isOpen: true, title: 'Payment Complete', message: 'Full payment received', type: 'success' });
    } else {
      setAlertDialog({ isOpen: true, title: 'Partial Payment', message: `Remaining: ₹${remaining.toFixed(2)}`, type: 'info' });
    }
    setShowDepositModal(false);
  }, [cartSummary.netAmount, splitPayments, cart.items.length]);

  const handleOrderTypeChange = useCallback((newOrderType) => {
    setOrderType(newOrderType);
    if (newOrderType === 'table' && !selectedTable) {
      setShowTablesModal(true);
    }
  }, [selectedTable]);

  const handleDeleteHeldOrder = useCallback((orderId) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--classic-pos-grid-bg)',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top Chrome Bar - System Status Header */}
      <TopChrome
        terminalId="HQ-PC01"
        speechEnabled={speechEnabled}
        receiptPrintEnabled={receiptPrintEnabled}
        wholeSaleEnabled={wholeSaleEnabled}
        gstEnabled={gstEnabled}
        taxExempt={taxExempt}
        orderType={orderType}
        onOrderTypeChange={handleOrderTypeChange}
        onSpeechToggle={() => setSpeechEnabled(!speechEnabled)}
        onReceiptPrintToggle={() => setReceiptPrintEnabled(!receiptPrintEnabled)}
        onWholeSaleToggle={() => setWholeSaleEnabled(!wholeSaleEnabled)}
        onGstToggle={() => setGstEnabled(!gstEnabled)}
        onTaxExemptToggle={() => setTaxExempt(!taxExempt)}
        currentItem={selectedCartItem ? cart.items.find(i => i.id === selectedCartItem) : null}
        customer={selectedCustomer}
        table={selectedTable}
        server={selectedServer}
        heldOrdersCount={heldOrders.length}
        onHeldClick={() => setShowHeldOrdersModal(true)}
        onSplitBill={() => cart.items.length > 0 ? setShowSplitBillModal(true) : setAlertDialog({ isOpen: true, title: 'Empty Cart', message: 'Cart is empty!', type: 'warning' })}
        onOrderQueue={() => setShowOrderSequenceModal(true)}
        onVoidReason={() => setShowVoidReasonModal(true)}
        onManagerOverride={() => setShowManagerOverrideModal(true)}
        onInventory={() => setShowInventoryModal(true)}
        onWasteTracking={() => setShowWasteTrackingModal(true)}
        onTableMap={() => setShowTableMapModal(true)}
        onReservations={() => setShowReservationModal(true)}
        onWaitlist={() => setShowWaitlistModal(true)}
        onSalesDashboard={() => setShowSalesDashboard(true)}
        onAnalytics={() => setShowAnalyticsModal(true)}
        onDelayedFiring={() => setShowDelayedFiringModal(true)}
        onStaff={() => setShowStaffModal(true)}
        onShifts={() => setShowShiftModal(true)}
        onDietary={() => setShowDietaryModal(true)}
        onDeposits={() => setShowDepositModal(true)}
        onCancelOrder={() => setShowOrderCancellationModal(true)}
        onEditPrice={() => selectedCartItem ? setShowEditPriceModal(true) : setAlertDialog({ isOpen: true, title: 'No Item Selected', message: 'Please select an item from the cart to edit its price.', type: 'warning' })}
      />

      {/* Main Content - Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel (62%) - Cart, Inputs, Categories, Products */}
        <div style={{ width: '62%', display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', overflow: 'hidden' }}>
          
          {/* Cart Table */}
          <CartTable
            cartItems={cart.items}
            selectedItemId={selectedCartItem}
            onSelectItem={handleCartItemSelect}
            onDeleteItem={handleCartItemDelete}
            onQuantityChange={handleCartItemQtyChange}
          />

          {/* Quick Bar Inputs */}
          <QuickBarInputs
            itemCode={quickBarInputs.itemCode}
            description={quickBarInputs.description}
            qty={quickBarInputs.qty}
            price={quickBarInputs.price}
            amount={quickBarInputs.amount}
            salesmanId={quickBarInputs.salesmanId}
            menuItems={menuItems}
            onInputChange={handleQuickBarInputChange}
            onEnter={handleQuickBarEnter}
            onFocus={setFocusedInput}
          />

          {/* Order Notes Input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Order Notes (special requests, allergies, etc.)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--classic-pos-input-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                fontSize: '12px'
              }}
            />
            <button
              onClick={() => setShowItemModificationsModal(true)}
              style={{
                padding: '8px 16px',
                background: 'var(--classic-pos-keypad-num-bg)',
                color: 'var(--classic-pos-name-color)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Modify Item
            </button>
          </div>

          {/* Server Selection */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ color: 'var(--classic-pos-code-color)', fontSize: '11px', minWidth: '60px' }}>Server:</label>
            <select
              value={selectedServer || ''}
              onChange={(e) => setSelectedServer(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--classic-pos-input-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                fontSize: '12px'
              }}
            >
              <option value="">Select Server</option>
              <option value="server1">Server 1</option>
              <option value="server2">Server 2</option>
              <option value="server3">Server 3</option>
            </select>
          </div>

          {/* Kitchen Station Selection */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ color: 'var(--classic-pos-code-color)', fontSize: '11px', minWidth: '60px' }}>Station:</label>
            <select
              value={kitchenStation}
              onChange={(e) => setKitchenStation(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--classic-pos-input-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                fontSize: '12px'
              }}
            >
              <option value="bar">Bar</option>
              <option value="kitchen">Kitchen</option>
              <option value="prep">Prep Station</option>
              <option value="grill">Grill Station</option>
              <option value="dessert">Dessert Station</option>
            </select>
          </div>

          {/* Category Bar */}
          <CategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />

          {/* Product Grid */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <ProductGrid
              items={menuItems
                .map(m => ({ id: m.id || m.name, name: m.name, price: m.price || 0, category: m.category || 'All', code: m.code || '' }))
                .filter(item => {
                  const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
                  const matchesSearch = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.id.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesCategory && matchesSearch;
                }) || []}
              selectedCategory={selectedCategory}
              onItemClick={handleMenuItemClick}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Right Panel (38%) - Function Keys, Numpad+Summary, Payment */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', background: 'var(--classic-pos-panel-bg)', borderLeft: '1px solid var(--classic-pos-panel-border)', overflow: 'auto' }}>

          {/* Function Key Panel */}
          <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />

          {/* Numpad and Order Summary - Side by Side */}
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            {/* Numeric Keypad */}
            <div style={{ flex: 1 }}>
              <NumericKeypad
                onValueChange={handleKeypadChange}
                onEnter={handleKeypadEnter}
                onClear={handleKeypadClear}
              />
            </div>

            {/* Order Summary Panel */}
            <div style={{ flex: 1 }}>
              <OrderSummaryPanel summary={cartSummary} />
            </div>
          </div>

          {/* Payment Buttons */}
          <ActionButtons
            buttons={[
              { id: 'cash', label: 'CASH', style: 'cash' },
              { id: 'gpay', label: 'GPAY', style: 'gpay' },
              { id: 'phonepay', label: 'PHONE PAY', style: 'phonepay' },
              { id: 'razorpay', label: 'RAZORPAY', style: 'other' },
              { id: 'upi', label: 'UPI', style: 'other' },
              { id: 'paytm', label: 'PAYTM', style: 'other' },
            ]}
            onButtonClick={handlePaymentClick}
          />
        </div>
      </div>

      {/* Modals */}
      {showHeldOrdersModal && (
        <HeldOrdersModal
          heldOrders={heldOrders}
          onRecallOrder={handleRecallOrder}
          onDeleteOrder={handleDeleteHeldOrder}
          onClose={() => setShowHeldOrdersModal(false)}
        />
      )}

      {showOrderHistoryModal && (
        <OrderHistoryModal
          orders={orderHistory}
          onRecallOrder={handleRecallHistoryOrder}
          onPrintOrder={handlePrintHistoryOrder}
          onClose={() => setShowOrderHistoryModal(false)}
        />
      )}

      {showTablesModal && (
        <TablesModal
          tables={null}
          onSelectTable={handleSelectTable}
          onClose={() => setShowTablesModal(false)}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          customer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          initialPaymentMethod={selectedPaymentMethod}
          orderDetails={{
            orderId: currentOrderId || `order_${Date.now()}`,
            amount: cartSummary.netAmount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
          }}
          customerInfo={{
            name: selectedCustomer?.name || 'Guest',
            phone: selectedCustomer?.phone || '',
            email: selectedCustomer?.email || ''
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={(detail) => {
            console.error('[ClassicOrdersLayout] Payment failed:', detail);
          }}
        />
      )}

      {/* Split Payment Modal */}
      {showSplitPaymentModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Split Payment</h3>
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Total: ₹{cartSummary.netAmount.toFixed(2)} | Remaining: ₹{(cartSummary.netAmount - splitPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
            </p>
            
            {splitPayments.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--classic-pos-code-color)', marginBottom: '8px', fontSize: '12px' }}>Payments Made:</h4>
                {splitPayments.map((payment, index) => (
                  <div key={index} style={{ color: 'var(--classic-pos-name-color)', fontSize: '12px', marginBottom: '4px' }}>
                    {payment.method}: ₹{payment.amount.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Payment Method:</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)',
                  marginBottom: '12px'
                }}
                id="splitPaymentMethod"
              >
                <option value="cash">Cash</option>
                <option value="razorpay">Razorpay</option>
                <option value="upi">UPI</option>
                <option value="gpay">GPay</option>
                <option value="phonepay">PhonePe</option>
                <option value="paytm">Paytm</option>
              </select>
              
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Amount:</label>
              <input
                type="number"
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
                id="splitPaymentAmount"
                defaultValue={(cartSummary.netAmount - splitPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSplitPaymentModal(false);
                  setSplitPayments([]);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const method = document.getElementById('splitPaymentMethod')?.value;
                  const amount = parseFloat(document.getElementById('splitPaymentAmount')?.value || '0');
                  if (method && !isNaN(amount)) {
                    handleSplitPayment(method, amount);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter valid payment method and amount', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitBillModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Split Bill</h3>
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Total: ₹{cartSummary.netAmount.toFixed(2)}
            </p>
            
            {/* Split Method Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Split Method:</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
                id="splitMethod"
                onChange={(e) => {
                  const method = e.target.value;
                  const splitByPerson = document.getElementById('splitByPerson');
                  const splitByAmount = document.getElementById('splitByAmount');
                  const splitByItem = document.getElementById('splitByItem');
                  const splitByCount = document.getElementById('splitByCount');
                  if (splitByPerson) splitByPerson.style.display = method === 'person' ? 'block' : 'none';
                  if (splitByAmount) splitByAmount.style.display = method === 'amount' ? 'block' : 'none';
                  if (splitByItem) splitByItem.style.display = method === 'item' ? 'block' : 'none';
                  if (splitByCount) splitByCount.style.display = method === 'count' ? 'block' : 'none';
                }}
              >
                <option value="count">By Number of People</option>
                <option value="amount">By Custom Amounts</option>
                <option value="item">By Items</option>
                <option value="person">By Person</option>
              </select>
            </div>

            {/* Split by Count */}
            <div id="splitByCount" style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Number of ways to split:</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
                id="splitCount"
              >
                <option value="2">2 ways</option>
                <option value="3">3 ways</option>
                <option value="4">4 ways</option>
                <option value="5">5 ways</option>
                <option value="6">6 ways</option>
                <option value="8">8 ways</option>
                <option value="10">10 ways</option>
              </select>
            </div>

            {/* Split by Amount */}
            <div id="splitByAmount" style={{ marginBottom: '16px', display: 'none' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Custom Amounts (comma-separated):</label>
              <input
                type="text"
                id="splitAmounts"
                placeholder="e.g., 100, 150, 200"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>

            {/* Split by Item */}
            <div id="splitByItem" style={{ marginBottom: '16px', display: 'none' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Assign items to people:</label>
              {cart.items.map((item, idx) => (
                <div key={item.id} style={{ marginBottom: '8px', padding: '8px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--classic-pos-keypad-text)', marginRight: '8px' }}>{item.name} (₹{item.amount.toFixed(2)})</span>
                  <select
                    style={{
                      padding: '4px',
                      background: 'var(--classic-pos-panel-bg)',
                      border: '1px solid var(--classic-pos-input-border)',
                      borderRadius: '4px',
                      color: 'var(--classic-pos-name-color)'
                    }}
                    id={`itemAssign_${idx}`}
                  >
                    <option value="Person 1">Person 1</option>
                    <option value="Person 2">Person 2</option>
                    <option value="Person 3">Person 3</option>
                    <option value="Person 4">Person 4</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Split by Person */}
            <div id="splitByPerson" style={{ marginBottom: '16px', display: 'none' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Number of people:</label>
              <input
                type="number"
                id="splitPersonCount"
                defaultValue="2"
                min="2"
                max="10"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSplitBillModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const method = document.getElementById('splitMethod')?.value;
                  if (method === 'count') {
                    const splitCount = parseInt(document.getElementById('splitCount')?.value || '2');
                    if (!isNaN(splitCount) && splitCount > 0) {
                      handleSplitBill(splitCount);
                    } else {
                      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid split count', type: 'warning' });
                    }
                  } else if (method === 'amount') {
                    const amounts = document.getElementById('splitAmounts')?.value?.split(',').map(a => parseFloat(a.trim())) || [];
                    if (amounts.every(a => !isNaN(a))) {
                      handleSplitBillByAmount(amounts);
                    } else {
                      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter valid amounts separated by commas', type: 'warning' });
                    }
                  } else if (method === 'item') {
                    const assignments = cart.items.map((item, idx) => ({
                      itemId: item.id,
                      person: document.getElementById(`itemAssign_${idx}`)?.value || '1'
                    }));
                    handleSplitBillByItem(assignments);
                  } else if (method === 'person') {
                    const personCount = parseInt(document.getElementById('splitPersonCount')?.value || '2');
                    if (!isNaN(personCount) && personCount > 0) {
                      handleSplitBill(personCount);
                    } else {
                      setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid person count', type: 'warning' });
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Split Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modifications Modal */}
      {showItemModificationsModal && selectedCartItem && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Item Modifications</h3>
            <textarea
              placeholder="Special requests, allergies, preparation notes..."
              style={{
                width: '100%',
                height: '100px',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="itemModificationsText"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowItemModificationsModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const text = document.getElementById('itemModificationsText')?.value || '';
                  if (selectedCartItem) {
                    handleItemModification(selectedCartItem, text);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'No Item Selected', message: 'Please select an item to modify', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Order Modal */}
      {showVoidOrderModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Void Order</h3>
            <select
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="voidOrderSelect"
            >
              {orderHistory.filter(o => o.status === 'completed').map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - ₹{order.total?.toFixed(2)}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Reason for void..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="voidReasonText"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowVoidOrderModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const orderId = document.getElementById('voidOrderSelect')?.value;
                  const reason = document.getElementById('voidReasonText')?.value || '';
                  if (orderId && reason) {
                    handleVoidOrder(orderId, reason);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an order and enter a reason', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-delete-btn-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Void Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Process Refund</h3>
            <select
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="refundOrderSelect"
            >
              {orderHistory.filter(o => o.status === 'completed').map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - ₹{order.total?.toFixed(2)}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Refund Amount"
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="refundAmount"
            />
            <textarea
              placeholder="Reason for refund..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="refundReasonText"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRefundModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const orderId = document.getElementById('refundOrderSelect')?.value;
                  const amount = parseFloat(document.getElementById('refundAmount')?.value || '0');
                  const reason = document.getElementById('refundReasonText')?.value || '';
                  if (orderId && !isNaN(amount) && amount > 0 && reason) {
                    handleRefund(orderId, amount, reason);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an order, enter a valid amount and reason', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-menu-btn-4)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Modal */}
      {showExchangeModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Exchange Items</h3>
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Current cart items will be exchanged. Select original order:
            </p>
            <select
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="exchangeOrderSelect"
            >
              {orderHistory.filter(o => o.status === 'completed').map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - ₹{order.total?.toFixed(2)}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExchangeModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const originalOrderId = document.getElementById('exchangeOrderSelect')?.value;
                  if (originalOrderId && cart.items.length > 0) {
                    handleExchange(originalOrderId, cart.items);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an order and ensure cart has items', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Process Exchange
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Transfer Modal */}
      {showTableTransferModal && selectedTable && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Transfer Table</h3>
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Transfer order from {selectedTable} to:
            </p>
            <select
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="transferTableSelect"
            >
              <option value="T1">Table 1</option>
              <option value="T2">Table 2</option>
              <option value="T3">Table 3</option>
              <option value="T4">Table 4</option>
              <option value="T5">Table 5</option>
              <option value="T6">Table 6</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTableTransferModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const toTable = document.getElementById('transferTableSelect')?.value;
                  if (toTable && selectedTable) {
                    handleTableTransfer(selectedTable, toTable);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select a destination table', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Merge Modal */}
      {showOrderMergeModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Merge Order</h3>
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Merge current cart with existing order:
            </p>
            <select
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--classic-pos-grid-bg)',
                border: '1px solid var(--classic-pos-input-border)',
                borderRadius: '4px',
                color: 'var(--classic-pos-name-color)',
                marginBottom: '16px'
              }}
              id="mergeOrderSelect"
            >
              {orderHistory.filter(o => o.status === 'completed').map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - ₹{order.total?.toFixed(2)}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderMergeModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetOrderId = document.getElementById('mergeOrderSelect')?.value;
                  if (targetOrderId) {
                    handleOrderMerge(targetOrderId);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an order to merge', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Merge Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Options Modal */}
      {showReceiptOptionsModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Receipt Customization</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showLogo}
                  onChange={(e) => handleReceiptOptionsChange('showLogo', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Logo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showCustomer}
                  onChange={(e) => handleReceiptOptionsChange('showCustomer', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Customer Info
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showTable}
                  onChange={(e) => handleReceiptOptionsChange('showTable', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Table Info
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showServer}
                  onChange={(e) => handleReceiptOptionsChange('showServer', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Server Info
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showGST}
                  onChange={(e) => handleReceiptOptionsChange('showGST', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show GST
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showDiscount}
                  onChange={(e) => handleReceiptOptionsChange('showDiscount', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Discount
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={receiptOptions.showTimestamp}
                  onChange={(e) => handleReceiptOptionsChange('showTimestamp', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Timestamp
              </label>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Custom Footer Text:</label>
              <input
                type="text"
                value={receiptOptions.customFooter}
                onChange={(e) => handleReceiptOptionsChange('customFooter', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReceiptOptionsModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowReceiptOptionsModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day End Report Modal */}
      {showDayEndReportModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Day End Report</h3>
            
            {dayEndReport ? (
              <div>
                <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
                  Date: {dayEndReport.date}
                </p>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Summary</h4>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Sales: ₹{dayEndReport.totalSales.toFixed(2)}</p>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Orders: {dayEndReport.totalOrders}</p>
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Payment Methods</h4>
                  {Object.entries(dayEndReport.paymentMethods).map(([method, amount]) => (
                    <p key={method} style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>
                      {method.toUpperCase()}: ₹{amount.toFixed(2)}
                    </p>
                  ))}
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Recent Orders ({dayEndReport.orders.length})</h4>
                  {dayEndReport.orders.slice(0, 10).map(order => (
                    <div key={order.id} style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '4px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                      {order.orderNumber} - ₹{(order.total || 0).toFixed(2)} - {order.paymentMethod?.toUpperCase() || 'CASH'}
                    </div>
                  ))}
                  {dayEndReport.orders.length > 10 && (
                    <p style={{ color: 'var(--classic-pos-code-color)', fontSize: '11px', marginTop: '8px' }}>
                      ... and {dayEndReport.orders.length - 10} more orders
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
                Generate report for today's orders?
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDayEndReportModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {!dayEndReport && (
                <button
                  onClick={handleDayEndReport}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--classic-pos-keypad-num-bg)',
                    color: 'var(--classic-pos-keypad-text)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '700px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Inventory Management</h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Low Stock Threshold: {inventory.lowStockThreshold}</h4>
              <input
                type="number"
                defaultValue={inventory.lowStockThreshold}
                onChange={(e) => setInventory(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                style={{
                  padding: '4px 8px',
                  background: 'var(--classic-pos-panel-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Stock Levels</h4>
              {Object.entries(inventory.items).length === 0 ? (
                <p style={{ color: 'var(--classic-pos-code-color)' }}>No inventory data available</p>
              ) : (
                Object.entries(inventory.items).map(([itemId, data]) => (
                  <div key={itemId} style={{ 
                    padding: '8px', 
                    background: data.quantity <= inventory.lowStockThreshold ? '#3A1A1A' : '#1A1A1A', 
                    borderRadius: '4px', 
                    marginBottom: '8px',
                    border: data.quantity <= inventory.lowStockThreshold ? '1px solid #DC2626' : '1px solid #333'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--classic-pos-name-color)' }}>{itemId}</span>
                      <span style={{ color: data.quantity <= inventory.lowStockThreshold ? '#DC2626' : '#888' }}>
                        Qty: {data.quantity} {data.quantity <= inventory.lowStockThreshold && '(LOW STOCK)'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInventoryModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waste Tracking Modal */}
      {showWasteTrackingModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Waste Tracking</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Item ID:</label>
              <input
                type="text"
                id="wasteItemId"
                placeholder="Enter item ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Quantity:</label>
              <input
                type="number"
                id="wasteQuantity"
                placeholder="Enter quantity"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Reason:</label>
              <select
                id="wasteReason"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                <option value="expired">Expired</option>
                <option value="spoiled">Spoiled</option>
                <option value="damaged">Damaged</option>
                <option value="preparation_error">Preparation Error</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowWasteTrackingModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const itemId = document.getElementById('wasteItemId')?.value;
                  const quantity = parseFloat(document.getElementById('wasteQuantity')?.value || '0');
                  const reason = document.getElementById('wasteReason')?.value || '';
                  if (itemId && !isNaN(quantity) && quantity > 0 && reason) {
                    handleWasteTracking(itemId, quantity, reason);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an item, enter a valid quantity and reason', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#DC2626',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Record Waste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Deposit Payment</h3>
            
            <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '16px' }}>
              Total: ₹{cartSummary.netAmount.toFixed(2)}
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Deposit Amount:</label>
              <input
                type="number"
                id="depositAmount"
                placeholder="Enter deposit amount"
                max={cartSummary.netAmount}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDepositModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amount = parseFloat(document.getElementById('depositAmount')?.value || '0');
                  if (!isNaN(amount) && amount > 0) {
                    handleDeposit(amount);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid deposit amount', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Process Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Dashboard Modal */}
      {showSalesDashboard && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Real-Time Sales Dashboard</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '8px' }}>Today's Sales</h4>
                <p style={{ color: '#4ADE80', fontSize: '24px', fontWeight: 'bold' }}>
                  ₹{orderHistory.reduce((sum, o) => {
                    const orderDate = new Date(o.timestamp);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString() ? sum + (o.total || 0) : sum;
                  }, 0).toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '8px' }}>Orders Today</h4>
                <p style={{ color: 'var(--classic-pos-keypad-num-bg)', fontSize: '24px', fontWeight: 'bold' }}>
                  {orderHistory.filter(o => {
                    const orderDate = new Date(o.timestamp);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '8px' }}>Avg Order Value</h4>
                <p style={{ color: '#F472B6', fontSize: '24px', fontWeight: 'bold' }}>
                  ₹{(orderHistory.reduce((sum, o) => {
                    const orderDate = new Date(o.timestamp);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString() ? sum + (o.total || 0) : sum;
                  }, 0) / Math.max(1, orderHistory.filter(o => {
                    const orderDate = new Date(o.timestamp);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString();
                  }).length)).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Recent Orders</h4>
              {orderHistory.slice(0, 5).map(order => (
                <div key={order.id} style={{ 
                  padding: '8px', 
                  background: 'var(--classic-pos-grid-bg)', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: 'var(--classic-pos-code-color)' }}>{order.orderNumber}</span>
                  <span style={{ color: 'var(--classic-pos-name-color)' }}>₹{(order.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSalesDashboard(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Analytics & Reports</h3>
            
            {!analyticsData ? (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleGenerateAnalytics}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--classic-pos-keypad-num-bg)',
                    color: 'var(--classic-pos-keypad-text)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Today's Analytics
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Summary</h4>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Revenue: ₹{analyticsData.totalRevenue.toFixed(2)}</p>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Cost: ₹{analyticsData.totalCost.toFixed(2)}</p>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Profit Margin: {analyticsData.profitMargin.toFixed(2)}%</p>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Tax: ₹{analyticsData.totalTax.toFixed(2)}</p>
                  <p style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>Total Orders: {analyticsData.totalOrders}</p>
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Staff Performance</h4>
                  {Object.entries(analyticsData.staffPerformance).length === 0 ? (
                    <p style={{ color: 'var(--classic-pos-code-color)' }}>No staff data available</p>
                  ) : (
                    Object.entries(analyticsData.staffPerformance).map(([staffName, data]) => (
                      <div key={staffName} style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>
                        {staffName}: {data.orders} orders - ₹{data.revenue.toFixed(2)}
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Top Items</h4>
                  {Object.entries(analyticsData.itemPerformance)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 5)
                    .map(([name, data]) => (
                      <div key={name} style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>
                        {name}: {data.quantity} sold - ₹{data.revenue.toFixed(2)}
                      </div>
                    ))}
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
                  <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Hourly Sales</h4>
                  {Object.entries(analyticsData.hourlySales)
                    .sort((a, b) => a[0] - b[0])
                    .map(([hour, amount]) => (
                      <div key={hour} style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>
                        {hour}:00 - ₹{amount.toFixed(2)}
                      </div>
                    ))}
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAnalyticsModal(false);
                  setAnalyticsData(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delayed Firing Modal */}
      {showDelayedFiringModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Delayed Order Firing</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Delay (minutes):</label>
              <input
                type="number"
                id="delayMinutes"
                placeholder="Enter delay in minutes"
                min="1"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDelayedFiringModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const delayMinutes = parseInt(document.getElementById('delayMinutes')?.value || '0');
                  if (!isNaN(delayMinutes) && delayMinutes > 0) {
                    handleDelayedFiring(currentOrderId, delayMinutes);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid delay time in minutes', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#F59E0B',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Schedule Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Map Modal */}
      {showTableMapModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '700px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Table Map</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {tableMap.tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => {
                    if (table.status === 'available') {
                      setSelectedTable(table.id);
                      setShowTableMapModal(false);
                    }
                  }}
                  style={{
                    padding: '16px',
                    background: table.status === 'available' ? '#1A1A1A' : 
                              table.status === 'occupied' ? '#1A3A1A' : '#3A1A1A',
                    border: `2px solid ${
                      table.status === 'available' ? '#4ADE80' : 
                      table.status === 'occupied' ? '#60A5FA' : '#F59E0B'
                    }`,
                    borderRadius: '8px',
                    cursor: table.status === 'available' ? 'pointer' : 'default',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ color: 'var(--classic-pos-name-color)', fontWeight: 'bold', marginBottom: '8px' }}>{table.id}</div>
                  <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '4px' }}>Capacity: {table.capacity}</div>
                  <div style={{ 
                    color: table.status === 'available' ? '#4ADE80' : 
                          table.status === 'occupied' ? '#60A5FA' : '#F59E0B', 
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {table.status}
                  </div>
                  {table.reservation && (
                    <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '11px', marginTop: '4px' }}>
                      Reserved: {table.reservation}
                    </div>
                  )}
                  {table.server && (
                    <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '11px', marginTop: '4px' }}>
                      Server: {table.server}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTableMapModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Table Reservation</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Table:</label>
              <select
                id="reservationTable"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                {tableMap.tables.filter(t => t.status === 'available').map(table => (
                  <option key={table.id} value={table.id}>{table.id} (Capacity: {table.capacity})</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Customer Name:</label>
              <input
                type="text"
                id="reservationCustomer"
                placeholder="Enter customer name"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Time:</label>
              <input
                type="time"
                id="reservationTime"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Party Size:</label>
              <input
                type="number"
                id="reservationPartySize"
                placeholder="Enter party size"
                min="1"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReservationModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const tableId = document.getElementById('reservationTable')?.value;
                  const customerName = document.getElementById('reservationCustomer')?.value || '';
                  const time = document.getElementById('reservationTime')?.value || '';
                  const partySize = parseInt(document.getElementById('reservationPartySize')?.value || '1');
                  if (tableId && customerName && time && !isNaN(partySize) && partySize > 0) {
                    handleTableReservation(tableId, customerName, time, partySize);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please fill in all required fields', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Waitlist Management</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Add to Waitlist</h4>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  id="waitlistName"
                  placeholder="Customer name"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--classic-pos-grid-bg)',
                    border: '1px solid var(--classic-pos-input-border)',
                    borderRadius: '4px',
                    color: 'var(--classic-pos-name-color)',
                    marginBottom: '8px'
                  }}
                />
                <input
                  type="number"
                  id="waitlistPartySize"
                  placeholder="Party size"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--classic-pos-grid-bg)',
                    border: '1px solid var(--classic-pos-input-border)',
                    borderRadius: '4px',
                    color: 'var(--classic-pos-name-color)',
                    marginBottom: '8px'
                  }}
                />
                <input
                  type="text"
                  id="waitlistPhone"
                  placeholder="Phone number"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--classic-pos-grid-bg)',
                    border: '1px solid var(--classic-pos-input-border)',
                    borderRadius: '4px',
                    color: 'var(--classic-pos-name-color)'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const customerName = document.getElementById('waitlistName')?.value || '';
                  const partySize = parseInt(document.getElementById('waitlistPartySize')?.value || '1');
                  const phone = document.getElementById('waitlistPhone')?.value || '';
                  if (customerName && !isNaN(partySize) && partySize > 0) {
                    handleWaitlistAdd(customerName, partySize, phone);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter customer name and valid party size', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add to Waitlist
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Current Waitlist</h4>
              {waitlist.length === 0 ? (
                <p style={{ color: 'var(--classic-pos-code-color)' }}>No parties on waitlist</p>
              ) : (
                waitlist.map((entry, index) => (
                  <div key={entry.id} style={{ 
                    padding: '8px', 
                    background: 'var(--classic-pos-grid-bg)', 
                    borderRadius: '4px', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ color: 'var(--classic-pos-name-color)' }}>{index + 1}. {entry.customerName}</div>
                      <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px' }}>
                        Party: {entry.partySize} | Phone: {entry.phone || 'N/A'}
                      </div>
                    </div>
                    <button
                      onClick={() => setWaitlist(prev => prev.filter(w => w.id !== entry.id))}
                      style={{
                        padding: '4px 8px',
                        background: '#DC2626',
                        color: 'var(--classic-pos-keypad-text)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowWaitlistModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Management Modal */}
      {showStaffModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Staff Management</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Current Staff: {currentStaff?.name || 'Not logged in'}</h4>
              {!currentStaff && (
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Login:</label>
                  <select
                    id="staffLogin"
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--classic-pos-grid-bg)',
                      border: '1px solid var(--classic-pos-input-border)',
                      borderRadius: '4px',
                      color: 'var(--classic-pos-name-color)'
                    }}
                  >
                    {staff.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const staffId = document.getElementById('staffLogin')?.value;
                      if (staffId) {
                        handleStaffLogin(staffId);
                      } else {
                        setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select a staff member', type: 'warning' });
                      }
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      background: 'var(--classic-pos-keypad-num-bg)',
                      color: 'var(--classic-pos-keypad-text)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Login
                  </button>
                </div>
              )}
              {currentStaff && (
                <button
                  onClick={handleStaffLogout}
                  style={{
                    padding: '8px 16px',
                    background: '#DC2626',
                    color: 'var(--classic-pos-keypad-text)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Staff List</h4>
              {staff.map(s => (
                <div key={s.id} style={{ 
                  padding: '8px', 
                  background: 'var(--classic-pos-grid-bg)', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: 'var(--classic-pos-name-color)' }}>{s.name}</div>
                    <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px' }}>
                      {s.role} | {s.permissions.join(', ')}
                    </div>
                  </div>
                  <span style={{ 
                    color: s.active ? '#4ADE80' : '#DC2626',
                    fontSize: '12px'
                  }}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStaffModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Management Modal */}
      {showShiftModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Shift Management</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Time Clock</h4>
              {Object.entries(timeClock).map(([staffId, clockData]) => {
                const staffMember = staff.find(s => s.id === staffId);
                return (
                  <div key={staffId} style={{ 
                    padding: '8px', 
                    background: 'var(--classic-pos-grid-bg)', 
                    borderRadius: '4px', 
                    marginBottom: '8px'
                  }}>
                    <div style={{ color: 'var(--classic-pos-name-color)' }}>{staffMember?.name || staffId}</div>
                    <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px' }}>
                      In: {clockData.loginTime ? new Date(clockData.loginTime).toLocaleTimeString() : 'N/A'}
                      {clockData.logoutTime && ` | Out: ${new Date(clockData.logoutTime).toLocaleTimeString()}`}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowShiftModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Reason Modal */}
      {showVoidReasonModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Void Reason</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Reason for void:</label>
              <select
                id="voidReason"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                <option value="customer_request">Customer Request</option>
                <option value="wrong_order">Wrong Order</option>
                <option value="item_unavailable">Item Unavailable</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Additional notes:</label>
              <textarea
                id="voidNotes"
                placeholder="Enter additional details"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)',
                  minHeight: '80px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowVoidReasonModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = document.getElementById('voidReason')?.value || '';
                  const notes = document.getElementById('voidNotes')?.value || '';
                  if (reason) {
                    setVoidReasons(prev => [...prev, { reason, notes, timestamp: Date.now() }]);
                    setShowVoidReasonModal(false);
                    setAlertDialog({ isOpen: true, title: 'Void Recorded', message: 'Void reason has been recorded', type: 'success' });
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please enter a void reason', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#DC2626',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Record Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Sequencing Modal */}
      {showOrderSequenceModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Order Sequencing</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Priority Level:</label>
              <select
                id="orderPriority"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--classic-pos-grid-bg)', borderRadius: '4px' }}>
              <h4 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '8px' }}>Current Queue</h4>
              {orderSequence.length === 0 ? (
                <p style={{ color: 'var(--classic-pos-code-color)' }}>No orders in queue</p>
              ) : (
                orderSequence.map((seq, idx) => (
                  <div key={idx} style={{ color: 'var(--classic-pos-code-color)', marginBottom: '4px' }}>
                    #{seq.sequenceNumber} - {seq.orderId} ({seq.priority})
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderSequenceModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const priority = document.getElementById('orderPriority')?.value;
                  if (priority) {
                    handleOrderSequence(priority);
                    setShowOrderSequenceModal(false);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select a priority level', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Cancellation Modal */}
      {showOrderCancellationModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Cancel Order</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Select Order to Cancel:</label>
              <select
                id="cancelOrderId"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                {orderHistory.map(order => (
                  <option key={order.id} value={order.id}>{order.id} - ₹{order.total?.toFixed(2)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Cancellation Reason:</label>
              <textarea
                id="cancelReason"
                placeholder="Enter reason for cancellation"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderCancellationModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const orderId = document.getElementById('cancelOrderId')?.value;
                  const reason = document.getElementById('cancelReason')?.value || '';
                  if (orderId && reason) {
                    handleOrderCancellation(orderId, reason);
                    setShowOrderCancellationModal(false);
                  } else {
                    setAlertDialog({ isOpen: true, title: 'Invalid Input', message: 'Please select an order and enter a reason', type: 'warning' });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-delete-btn-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Override Modal */}
      {showManagerOverrideModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Manager Override Required</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Reason for override:</label>
              <textarea
                id="overrideReason"
                placeholder="Enter reason for manager override"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)',
                  minHeight: '80px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Manager ID:</label>
              <select
                id="overrideManager"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              >
                {staff.filter(s => s.role === 'manager').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowManagerOverrideModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = document.getElementById('overrideReason').value;
                  const managerId = document.getElementById('overrideManager').value;
                  handleManagerOverride(reason, managerId);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#F59E0B',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Request Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dietary Options Modal */}
      {showDietaryModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'var(--classic-pos-name-color)', marginBottom: '16px' }}>Dietary Restrictions</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="dietaryVegan"
                  style={{ cursor: 'pointer' }}
                />
                Vegan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="dietaryVegetarian"
                  style={{ cursor: 'pointer' }}
                />
                Vegetarian
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="dietaryGlutenFree"
                  style={{ cursor: 'pointer' }}
                />
                Gluten-Free
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="dietaryDairyFree"
                  style={{ cursor: 'pointer' }}
                />
                Dairy-Free
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--classic-pos-code-color)', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="dietaryNutFree"
                  style={{ cursor: 'pointer' }}
                />
                Nut-Free
              </label>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--classic-pos-code-color)', display: 'block', marginBottom: '8px' }}>Allergies:</label>
              <input
                type="text"
                id="dietaryAllergies"
                placeholder="Enter allergies (comma separated)"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--classic-pos-grid-bg)',
                  border: '1px solid var(--classic-pos-input-border)',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDietaryModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const dietaryVegan = document.getElementById('dietaryVegan')?.checked || false;
                  const dietaryVegetarian = document.getElementById('dietaryVegetarian')?.checked || false;
                  const dietaryGlutenFree = document.getElementById('dietaryGlutenFree')?.checked || false;
                  const dietaryDairyFree = document.getElementById('dietaryDairyFree')?.checked || false;
                  const dietaryNutFree = document.getElementById('dietaryNutFree')?.checked || false;
                  const dietaryAllergies = document.getElementById('dietaryAllergies')?.value || '';
                  
                  const restrictions = {
                    vegan: dietaryVegan,
                    vegetarian: dietaryVegetarian,
                    glutenFree: dietaryGlutenFree,
                    dairyFree: dietaryDairyFree,
                    nutFree: dietaryNutFree,
                    allergies: dietaryAllergies
                  };
                  setDietaryRestrictions(prev => [...prev, restrictions]);
                  setShowDietaryModal(false);
                  setAlertDialog({ isOpen: true, title: 'Dietary Options Saved', message: 'Dietary restrictions have been saved', type: 'success' });
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {showEditPriceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: 'var(--classic-pos-panel-bg)',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{
              color: 'var(--classic-pos-name-color)',
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '20px',
              marginTop: 0,
            }}>
              Edit Item Price
            </h3>
            
            {selectedCartItem && (() => {
              const item = cart.items.find(i => i.id === selectedCartItem);
              return item ? (
                <div style={{
                  background: 'var(--classic-pos-func-grid-bg)',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}>
                  <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginBottom: '4px' }}>Item</div>
                  <div style={{ color: 'var(--classic-pos-name-color)', fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                  <div style={{ color: 'var(--classic-pos-code-color)', fontSize: '12px', marginTop: '8px', marginBottom: '4px' }}>Current Price</div>
                  <div style={{ color: '#38EF7D', fontSize: '16px', fontWeight: '700' }}>₹{item.price?.toFixed(2)}</div>
                </div>
              ) : null;
            })()}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: 'var(--classic-pos-detail-text)',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                New Price
              </label>
              <input
                type="number"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--classic-pos-func-grid-bg)',
                  border: '1px solid #444444',
                  borderRadius: '4px',
                  color: 'var(--classic-pos-name-color)',
                  fontSize: '14px',
                }}
                placeholder="Enter new price"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditPriceModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-action-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditPriceSave}
                style={{
                  padding: '8px 16px',
                  background: 'var(--classic-pos-keypad-num-bg)',
                  color: 'var(--classic-pos-keypad-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}

