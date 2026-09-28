import React, { useState, useEffect } from 'react';
import { getKOTManager } from '../../operations/KOTManager.js';
import PaymentModal from '../pos/PaymentModal';
import Receipt from '../pos/Receipt';
import toastHardware from '../../services/ToastHardwareService.js';
import orderEventManager from '../../services/OrderEventManager.js';
import orderWorkflowService from '../../services/OrderWorkflowService.js';
import ORDER_CONFIG from '../../config/orderConfig.js';

// Mobile responsive hook
function useScreenSize() {
  const [screenSize, setScreenSize] = useState('large');
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('small');
      } else if (window.innerWidth < 1024) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return screenSize;
}

export default function ToastOrders({
  orders = [],
  setOrders,
  menuItems = [],
  setMenuItems,
  onNavigate,
  tables: propTables = [],
  setTables: setPropTables,
  customers = [],
  setCustomers,
  staff: propStaff = [],
  setStaff: setPropStaff,
  darkMode = false
}) {
  const screenSize = useScreenSize();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [orderType, setOrderType] = useState(ORDER_CONFIG.ORDER_TYPES.DINE_IN);
  const [customerName, setCustomerName] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [tableNumber, setTableNumber] = useState(ORDER_CONFIG.DEFAULT_TABLE_NUMBER);
  const [paymentMethod, setPaymentMethod] = useState(ORDER_CONFIG.PAYMENT_METHODS.CASH);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [gstRate, setGstRate] = useState(ORDER_CONFIG.DEFAULT_GST_RATE);

  // CFD Broadcast side effect
  useEffect(() => {
    toastHardware.broadcastCFD({
      items: cartItems,
      discount,
      gstRate,
      orderType
    });
  }, [cartItems, discount, gstRate, orderType]);

  
  // Seat functionality
  const [seats, setSeats] = useState([{ id: 1, name: 'Seat 1' }]);
  const [selectedSeat, setSelectedSeat] = useState(1);
  const [showSeatEditor, setShowSeatEditor] = useState(false);
  const [splitCheckMode, setSplitCheckMode] = useState(false);
  
  // Table mode: 'per-seat' (each seat has its own order) or 'per-table' (table-level ordering)
  const [tableMode, setTableMode] = useState('per-seat');
  
  // Category and course
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(ORDER_CONFIG.DEFAULT_COURSE);

  // Mobile panel switching state
  const [mobileActivePanel, setMobileActivePanel] = useState('order'); // 'order', 'categories', 'menu'
  const [guestCount, setGuestCount] = useState(4);
  
  // Additional UI states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [showModifiersPanel, setShowModifiersPanel] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [splitPayments, setSplitPayments] = useState({});
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showPrintConfig, setShowPrintConfig] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    kitchenPrinter: 'default',
    barPrinter: 'default',
    receiptPrinter: 'default',
    autoPrint: true,
    receiptHeader: '',
    receiptFooter: 'Thank you for dining with us!',
    showLogo: true,
    showServer: true,
    showTimestamp: true
  });
  const [courseSequence, setCourseSequence] = useState(ORDER_CONFIG.DEFAULT_COURSE_SEQUENCE);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [showSplitCheckModal, setShowSplitCheckModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [showServiceChargeModal, setShowServiceChargeModal] = useState(false);
  const [showCashDrawer, setShowCashDrawer] = useState(false);
  const [cashDrawer, setCashDrawer] = useState({
    startingBalance: 0,
    currentBalance: 0,
    transactions: []
  });
  const [showItemDiscountModal, setShowItemDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState(null);
  const [showSplitItemModal, setShowSplitItemModal] = useState(false);
  const [selectedItemForSplit, setSelectedItemForSplit] = useState(null);
  const [showTransferItemModal, setShowTransferItemModal] = useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);
  const [showVoidItemModal, setShowVoidItemModal] = useState(false);
  const [selectedItemForVoid, setSelectedItemForVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [showDuplicateOrderModal, setShowDuplicateOrderModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [cartSearch, setCartSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showSizeVariantModal, setShowSizeVariantModal] = useState(false);
  const [selectedItemForSize, setSelectedItemForSize] = useState(null);
  const [showModifierPricingModal, setShowModifierPricingModal] = useState(false);
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [modifierPricing, setModifierPricing] = useState({});
  const [showCustomerNotesModal, setShowCustomerNotesModal] = useState(false);
  const [selectedCustomerForNotes, setSelectedCustomerForNotes] = useState(null);
  const [customerNotes, setCustomerNotes] = useState({});
  const [showServerAssignmentModal, setShowServerAssignmentModal] = useState(false);
  const [assignedServer, setAssignedServer] = useState('');
  const [orderTiming, setOrderTiming] = useState({ prepTime: 15, fireTime: 0 });
  const [showOrderTimingModal, setShowOrderTimingModal] = useState(false);
  const [showTaxExemptionModal, setShowTaxExemptionModal] = useState(false);
  const [taxExempt, setTaxExempt] = useState(false);

  // Real-time order event synchronization
  useEffect(() => {
    // Subscribe to order completed events
    const unsubscribeOrderCompleted = orderEventManager.on('order:completed', (order) => {
      console.log('[ToastOrders] Order completed:', order.id);
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: 'COMPLETED' } : o
        ));
      }
    });

    // Subscribe to order paid events
    const unsubscribeOrderPaid = orderEventManager.on('order:paid', ({ order, paymentData }) => {
      console.log('[ToastOrders] Order paid:', order.id);
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: 'PAID', payment: paymentData } : o
        ));
      }
    });

    // Subscribe to table status changes
    const unsubscribeTableStatus = orderEventManager.on('table:status', ({ tableId, newStatus, tableData }) => {
      console.log('[ToastOrders] Table status changed:', tableId, newStatus);
      if (setTables) {
        setTables(prev => prev.map(t => 
          t.id === tableId || t.number === parseInt(tableId)
            ? { ...t, status: newStatus, ...tableData }
            : t
        ));
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeOrderCompleted();
      unsubscribeOrderPaid();
      unsubscribeTableStatus();
    };
  }, [setOrders, setTables]);
  const [taxExemptReason, setTaxExemptReason] = useState('');
  const [kitchenDelay, setKitchenDelay] = useState(false);
  const [kitchenDelayReason, setKitchenDelayReason] = useState('');
  const [showKitchenDelayModal, setShowKitchenDelayModal] = useState(false);
  const [showTableTransferModal, setShowTableTransferModal] = useState(false);
  const [targetTable, setTargetTable] = useState('');
  const [showTableEditModal, setShowTableEditModal] = useState(false);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState(null);
  const [showTableMergeModal, setShowTableMergeModal] = useState(false);
  const [mergeTable1, setMergeTable1] = useState('');
  const [mergeTable2, setMergeTable2] = useState('');
  const [showTableAssignModal, setShowTableAssignModal] = useState(false);
  const [tableToAssign, setTableToAssign] = useState(null);
  const [assignCustomerName, setAssignCustomerName] = useState('');
  const [tableNotes, setTableNotes] = useState(() => {
    const saved = localStorage.getItem('table_notes');
    return saved ? JSON.parse(saved) : {};
  });
  const [tableConfig, setTableConfig] = useState(() => {
    const saved = localStorage.getItem('table_config');
    return saved ? JSON.parse(saved) : {};
  });
  const [tableMerges, setTableMerges] = useState(() => {
    const saved = localStorage.getItem('table_merges');
    return saved ? JSON.parse(saved) : {};
  });
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : {};
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState(() => {
    const saved = localStorage.getItem('loyalty_points');
    return saved ? JSON.parse(saved) : {};
  });

  // Staff/Waiter integration
  const [staff, setStaff] = useState(() => {
    if (propStaff && propStaff.length > 0) return propStaff;
    const saved = localStorage.getItem('staff');
    return saved ? JSON.parse(saved) : [];
  });
  const assignedServerHandler = setPropStaff || setStaff;
  
  // Toast POS Categories - Added "All" to show everything
  const categories = [
    'All', 'Other', 'Msgs', 'Beers', 'Cocktails', 'Red Wines', 
    'White Wines', 'Breakfast', 'Beverages', 'Brunch', 
    'Appetizer', 'Salads', 'Entrees', 'Sandwich', 'Sides'
  ];

  // Initialize menu with Toast POS categories if empty
  useEffect(() => {
    // Always populate if empty or if items don't have Toast POS categories
    const hasToastCategories = menuItems && menuItems.some(item => 
      ['Beers', 'Cocktails', 'Red Wines', 'White Wines', 'Breakfast', 'Beverages', 'Brunch', 'Appetizer', 'Salads', 'Entrees', 'Sandwich', 'Sides'].includes(item.category)
    );
    
    if (!menuItems || menuItems.length === 0 || !hasToastCategories) {
      const toastMenuItems = [
        // Beers
        { id: 'beer-1', name: 'Allagash White', price: 8.00, category: 'Beers', description: 'Belgian-style wheat ale', subcategory: 'Import' },
        { id: 'beer-2', name: 'Stella Artois', price: 7.00, category: 'Beers', description: 'Belgian lager', subcategory: 'Import' },
        { id: 'beer-3', name: 'Stone Ipa', price: 9.00, category: 'Beers', description: 'India Pale Ale', subcategory: 'Craft' },
        { id: 'beer-4', name: 'Guinness Stout', price: 8.00, category: 'Beers', description: 'Irish dry stout', subcategory: 'Import' },
        { id: 'beer-5', name: 'Heineken', price: 7.50, category: 'Beers', description: 'Dutch lager', subcategory: 'Import' },
        { id: 'beer-6', name: 'Corona', price: 6.50, category: 'Beers', description: 'Mexican lager', subcategory: 'Import' },
        { id: 'beer-7', name: 'Blue Moon', price: 7.00, category: 'Beers', description: 'Belgian white', subcategory: 'Craft' },
        { id: 'beer-8', name: 'Angry Orchard', price: 6.50, category: 'Beers', description: 'Hard cider', subcategory: 'Cider' },
        
        // Cocktails
        { id: 'cocktail-1', name: 'Mojito', price: 12.00, category: 'Cocktails', description: 'Rum, mint, lime', subcategory: 'Classic' },
        { id: 'cocktail-2', name: 'Margarita', price: 11.00, category: 'Cocktails', description: 'Tequila, lime, triple sec', subcategory: 'Classic' },
        { id: 'cocktail-3', name: 'Old Fashioned', price: 13.00, category: 'Cocktails', description: 'Bourbon, bitters, sugar', subcategory: 'Classic' },
        { id: 'cocktail-4', name: 'Martini', price: 14.00, category: 'Cocktails', description: 'Gin or vodka, vermouth', subcategory: 'Classic' },
        { id: 'cocktail-5', name: 'Mai Tai', price: 12.00, category: 'Cocktails', description: 'Rum, orange curaçao', subcategory: 'Tropical' },
        { id: 'cocktail-6', name: 'Cosmopolitan', price: 11.00, category: 'Cocktails', description: 'Vodka, cranberry, lime', subcategory: 'Modern' },
        
        // Red Wines
        { id: 'red-1', name: 'Cabernet Sauvignon', price: 12.00, category: 'Red Wines', description: 'Full-bodied red', subcategory: 'Bold' },
        { id: 'red-2', name: 'Merlot', price: 11.00, category: 'Red Wines', description: 'Smooth red', subcategory: 'Medium' },
        { id: 'red-3', name: 'Pinot Noir', price: 13.00, category: 'Red Wines', description: 'Light-bodied red', subcategory: 'Light' },
        { id: 'red-4', name: 'Malbec', price: 10.00, category: 'Red Wines', description: 'Argentine red', subcategory: 'Bold' },
        { id: 'red-5', name: 'Shiraz', price: 11.00, category: 'Red Wines', description: 'Australian red', subcategory: 'Bold' },
        
        // White Wines
        { id: 'white-1', name: 'Chardonnay', price: 11.00, category: 'White Wines', description: 'Full-bodied white', subcategory: 'Full' },
        { id: 'white-2', name: 'Sauvignon Blanc', price: 10.00, category: 'White Wines', description: 'Crisp white', subcategory: 'Crisp' },
        { id: 'white-3', name: 'Pinot Grigio', price: 10.00, category: 'White Wines', description: 'Light white', subcategory: 'Light' },
        { id: 'white-4', name: 'Riesling', price: 9.00, category: 'White Wines', description: 'Sweet white', subcategory: 'Sweet' },
        { id: 'white-5', name: 'Prosecco', price: 11.00, category: 'White Wines', description: 'Sparkling white', subcategory: 'Sparkling' },
        
        // Breakfast
        { id: 'breakfast-1', name: 'Eggs Benedict', price: 14.00, category: 'Breakfast', description: 'Poached eggs, hollandaise', subcategory: 'Eggs' },
        { id: 'breakfast-2', name: 'Pancakes', price: 10.00, category: 'Breakfast', description: 'Stack of 3 with syrup', subcategory: 'Pancakes' },
        { id: 'breakfast-3', name: 'Omelette', price: 12.00, category: 'Breakfast', description: 'Three eggs with choice', subcategory: 'Eggs' },
        { id: 'breakfast-4', name: 'French Toast', price: 11.00, category: 'Breakfast', description: 'With maple syrup', subcategory: 'Pancakes' },
        { id: 'breakfast-5', name: 'Breakfast Burrito', price: 13.00, category: 'Breakfast', description: 'Eggs, cheese, salsa', subcategory: 'Burrito' },
        
        // Beverages
        { id: 'bev-1', name: 'Coffee', price: 3.00, category: 'Beverages', description: 'Fresh brewed', subcategory: 'Hot' },
        { id: 'bev-2', name: 'Espresso', price: 4.00, category: 'Beverages', description: 'Single shot', subcategory: 'Hot' },
        { id: 'bev-3', name: 'Tea', price: 2.50, category: 'Beverages', description: 'Hot or iced', subcategory: 'Hot' },
        { id: 'bev-4', name: 'Orange Juice', price: 4.00, category: 'Beverages', description: 'Fresh squeezed', subcategory: 'Fresh' },
        { id: 'bev-5', name: 'Smoothie', price: 6.00, category: 'Beverages', description: 'Mixed fruit', subcategory: 'Cold' },
        { id: 'bev-6', name: 'Iced Coffee', price: 4.50, category: 'Beverages', description: 'Cold brew', subcategory: 'Cold' },
        
        // Appetizer
        { id: 'app-1', name: 'Nachos', price: 12.00, category: 'Appetizer', description: 'Loaded with cheese', subcategory: 'Shared' },
        { id: 'app-2', name: 'Wings', price: 11.00, category: 'Appetizer', description: 'Buffalo style', subcategory: 'Shared' },
        { id: 'app-3', name: 'Mozzarella Sticks', price: 9.00, category: 'Appetizer', description: 'Marinara sauce', subcategory: 'Individual' },
        { id: 'app-4', name: 'Calamari', price: 13.00, category: 'Appetizer', description: 'Fried with lemon', subcategory: 'Shared' },
        { id: 'app-5', name: 'Bruschetta', price: 8.00, category: 'Appetizer', description: 'Tomato, basil', subcategory: 'Individual' },
        
        // Salads
        { id: 'salad-1', name: 'Caesar Salad', price: 10.00, category: 'Salads', description: 'Romaine, parmesan', subcategory: 'Classic' },
        { id: 'salad-2', name: 'Greek Salad', price: 11.00, category: 'Salads', description: 'Feta, olives', subcategory: 'Mediterranean' },
        { id: 'salad-3', name: 'Garden Salad', price: 8.00, category: 'Salads', description: 'Mixed greens', subcategory: 'Light' },
        { id: 'salad-4', name: 'Cobb Salad', price: 12.00, category: 'Salads', description: 'Egg, bacon, avocado', subcategory: 'Protein' },
        { id: 'salad-5', name: 'Chef Salad', price: 11.00, category: 'Salads', description: 'Mixed greens, protein', subcategory: 'Protein' },
        
        // Entrees
        { id: 'entree-1', name: 'Steak', price: 28.00, category: 'Entrees', description: 'Grilled ribeye', subcategory: 'Grilled' },
        { id: 'entree-2', name: 'Salmon', price: 24.00, category: 'Entrees', description: 'Grilled Atlantic', subcategory: 'Grilled' },
        { id: 'entree-3', name: 'Chicken', price: 18.00, category: 'Entrees', description: 'Grilled breast', subcategory: 'Grilled' },
        { id: 'entree-4', name: 'Pasta Carbonara', price: 16.00, category: 'Entrees', description: 'Cream, bacon, egg', subcategory: 'Pasta' },
        { id: 'entree-5', name: 'Fish & Chips', price: 17.00, category: 'Entrees', description: 'Beer battered cod', subcategory: 'Fried' },
        
        // Sandwich
        { id: 'sand-1', name: 'Club Sandwich', price: 14.00, category: 'Sandwich', description: 'Turkey, bacon', subcategory: 'Classic' },
        { id: 'sand-2', name: 'BLT', price: 11.00, category: 'Sandwich', description: 'Bacon, lettuce, tomato', subcategory: 'Classic' },
        { id: 'sand-3', name: 'Grilled Cheese', price: 9.00, category: 'Sandwich', description: 'Melted cheddar', subcategory: 'Classic' },
        { id: 'sand-4', name: 'Reuben', price: 13.00, category: 'Sandwich', description: 'Corned beef, sauerkraut', subcategory: 'Classic' },
        { id: 'sand-5', name: 'Philly Cheesesteak', price: 12.00, category: 'Sandwich', description: 'Ribeye, peppers, onions', subcategory: 'Hot' },
        
        // Sides
        { id: 'side-1', name: 'Fries', price: 5.00, category: 'Sides', description: 'Crispy', subcategory: 'Potato' },
        { id: 'side-2', name: 'Onion Rings', price: 6.00, category: 'Sides', description: 'Battered', subcategory: 'Onion' },
        { id: 'side-3', name: 'Coleslaw', price: 4.00, category: 'Sides', description: 'Creamy', subcategory: 'Salad' },
        { id: 'side-4', name: 'Mashed Potatoes', price: 5.00, category: 'Sides', description: 'With gravy', subcategory: 'Potato' },
        { id: 'side-5', name: 'Garlic Bread', price: 4.50, category: 'Sides', description: 'Buttered', subcategory: 'Bread' },
        
        // Brunch
        { id: 'brunch-1', name: 'Avocado Toast', price: 12.00, category: 'Brunch', description: 'Sourdough, poached egg', subcategory: 'Toast' },
        { id: 'brunch-2', name: 'Eggs Florentine', price: 13.00, category: 'Brunch', description: 'Spinach, hollandaise', subcategory: 'Eggs' },
        { id: 'brunch-3', name: 'Quiche', price: 11.00, category: 'Brunch', description: 'Vegetable or meat', subcategory: 'Eggs' },
        { id: 'brunch-4', name: 'Belgian Waffles', price: 10.00, category: 'Brunch', description: 'With berries', subcategory: 'Waffles' },
        
        // Other
        { id: 'other-1', name: 'Water', price: 2.00, category: 'Other', description: 'Bottled', subcategory: 'Non-alcoholic' },
        { id: 'other-2', name: 'Soda', price: 3.00, category: 'Other', description: 'Various flavors', subcategory: 'Non-alcoholic' },
        { id: 'other-3', name: 'Sparkling Water', price: 3.00, category: 'Other', description: 'Perrier or San Pellegrino', subcategory: 'Non-alcoholic' },
      ];
      
      setMenuItems(toastMenuItems);
    }
  }, [menuItems, setMenuItems]); // Run when menuItems changes
  
  // Load print config and cash drawer from main settings
  useEffect(() => {
    const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
    
    // Sync print config with main settings
    setPrintConfig(prev => ({
      ...prev,
      autoPrint: mainSettings.receiptAutoPrint !== false,
      receiptHeader: mainSettings.customReceiptHeader || mainSettings.receiptHeader || '',
      receiptFooter: mainSettings.customReceiptFooter || mainSettings.receiptFooter || 'Thank you for dining with us!',
      showLogo: mainSettings.showLogoOnReceipt !== false,
      showServer: mainSettings.showCashierOnReceipt !== false,
      showTimestamp: true
    }));
    
    const savedCashDrawer = localStorage.getItem('cash_drawer');
    if (savedCashDrawer) {
      setCashDrawer(JSON.parse(savedCashDrawer));
    }
  }, []);

  // Use menuItems from props or empty array
  const displayMenuItems = menuItems || [];

  // Tables state
  const [localTables, setLocalTables] = useState(() => {
    if (propTables && propTables.length > 0) return propTables;
    const existingTables = [];
    for (let i = 1; i <= 20; i++) {
      existingTables.push({ id: i, number: i, status: ORDER_CONFIG.TABLE_STATUS.AVAILABLE, orderId: null });
    }
    return existingTables;
  });

  const tables = propTables && propTables.length > 0 ? propTables : localTables;
  const setTables = setPropTables || setLocalTables;

  // Food modifiers from the image
  const foodModifiers = [
    'Wheat toast',
    'Add 1 egg',
    'Add feta',
    'Add avocado',
    'Extra cheese',
    'No onions',
    'No cheese',
    'Well done',
    'Medium rare',
    'Gluten-free',
    'Vegan',
    'Spicy',
    'Mild',
    'Extra sauce',
    'Dressing on side'
  ];

  const getSubtotal = () => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getDiscountedSubtotal = () => getSubtotal() * (1 - discount / 100);
  const getServiceCharge = () => getDiscountedSubtotal() * (serviceCharge / 100);
  const getTax = () => taxExempt ? 0 : (getDiscountedSubtotal() + getServiceCharge()) * (ORDER_CONFIG.DEFAULT_GST_RATE / 100);
  const getTotal = () => getDiscountedSubtotal() + getServiceCharge() + getTax() + tipAmount;

  const addToCart = (item) => {
    const existingItem = cartItems.find(i => i.id === item.id && 
      JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers) && i.seatId === selectedSeat && i.course === selectedCourse);
    
    if (existingItem) {
      setCartItems(cartItems.map(i => 
        i.uniqueId === existingItem.uniqueId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      const uniqueId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCartItems([...cartItems, { 
        ...item, 
        uniqueId, 
        quantity: 1, 
        modifiers: item.modifiers || [], 
        seatId: selectedSeat,
        course: selectedCourse,
        originalPrice: item.price
      }]);
    }
    
    // Add to recent items
    setRecentItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [item, ...filtered].slice(0, 10);
    });
  };

  const removeFromCart = (uniqueId) => {
    setCartItems(cartItems.filter(i => i.uniqueId !== uniqueId));
  };

  const updateQuantity = (uniqueId, delta) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        const newQuantity = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQuantity };
      }
      return i;
    }));
  };

  // Apply discount to individual item
  const applyItemDiscount = (uniqueId, discountPercent) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        const originalPrice = i.originalPrice || i.price;
        const discountAmount = originalPrice * (discountPercent / 100);
        return { 
          ...i, 
          originalPrice: originalPrice,
          discountPercent, 
          discountAmount, 
          price: originalPrice - discountAmount 
        };
      }
      return i;
    }));
  };

  // Apply size variant
  const applySizeVariant = (uniqueId, size, priceMultiplier) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        const originalPrice = i.originalPrice || i.price;
        const newPrice = originalPrice * priceMultiplier;
        return {
          ...i,
          originalPrice: originalPrice,
          size,
          priceMultiplier,
          price: newPrice
        };
      }
      return i;
    }));
  };

  // Apply modifier pricing
  const applyModifierPricing = (uniqueId, modifier, price) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        const currentModifiers = i.modifiers || [];
        const currentPricing = i.modifierPricing || {};
        // Check if modifier already exists
        if (!currentModifiers.includes(modifier)) {
          return {
            ...i,
            modifiers: [...currentModifiers, modifier],
            modifierPricing: { ...currentPricing, [modifier]: price },
            price: i.price + price
          };
        }
      }
      return i;
    }));
  };

  // Split item between seats
  const splitItemBetweenSeats = (uniqueId, targetSeatIds) => {
    const item = cartItems.find(i => i.uniqueId === uniqueId);
    if (!item || targetSeatIds.length === 0) return;

    const quantityPerSeat = Math.floor(item.quantity / targetSeatIds.length);
    const remainder = item.quantity % targetSeatIds.length;

    setCartItems(cartItems.filter(i => i.uniqueId !== uniqueId));

    targetSeatIds.forEach((seatId, idx) => {
      const quantity = quantityPerSeat + (idx < remainder ? 1 : 0);
      if (quantity > 0) {
        const newUniqueId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCartItems(prev => [...prev, {
          ...item,
          uniqueId: newUniqueId,
          quantity,
          seatId
        }]);
      }
    });
  };

  // Transfer item to different seat
  const transferItemToSeat = (uniqueId, targetSeatId) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        return { ...i, seatId: targetSeatId };
      }
      return i;
    }));
  };

  // Void item with reason
  const voidItem = (uniqueId, reason) => {
    setCartItems(cartItems.filter(i => i.uniqueId !== uniqueId));
    // Log void for tracking
    console.log(`Item voided: ${reason}`);
  };

  // Duplicate entire order
  const duplicateOrder = () => {
    const duplicatedItems = cartItems.map(item => ({
      ...item,
      uniqueId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: item.quantity
    }));
    setCartItems([...cartItems, ...duplicatedItems]);
  };

  // Bulk actions
  const bulkDiscount = (discountPercent) => {
    selectedItems.forEach(uniqueId => {
      applyItemDiscount(uniqueId, discountPercent);
    });
    setSelectedItems([]);
  };

  const bulkTransfer = (targetSeatId) => {
    selectedItems.forEach(uniqueId => {
      transferItemToSeat(uniqueId, targetSeatId);
    });
    setSelectedItems([]);
  };

  const bulkVoid = (reason) => {
    selectedItems.forEach(uniqueId => {
      voidItem(uniqueId, reason);
    });
    setSelectedItems([]);
  };

  const toggleItemSelection = (uniqueId) => {
    setSelectedItems(prev => 
      prev.includes(uniqueId) 
        ? prev.filter(id => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(cartItems.map(item => item.uniqueId));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Filter cart items based on search
  const getFilteredCartItems = () => {
    if (!cartSearch) return cartItems;
    const searchLower = cartSearch.toLowerCase();
    return cartItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      (item.modifiers && item.modifiers.some(m => m.toLowerCase().includes(searchLower))) ||
      (item.category && item.category.toLowerCase().includes(searchLower))
    );
  };

  // Filter customers based on search
  const getFilteredCustomers = () => {
    if (!customerSearch) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.includes(searchLower))
    );
  };

  // Filter order history based on search
  const getFilteredOrderHistory = () => {
    const orderHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
    if (!historySearch) return orderHistory;
    const searchLower = historySearch.toLowerCase();
    return orderHistory.filter(order =>
      order.customerName.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.items.some(item => item.name.toLowerCase().includes(searchLower))
    );
  };

  // Inventory management
  const updateInventory = (itemId, quantity) => {
    const currentStock = inventory[itemId] || 0;
    const newStock = Math.max(0, currentStock - quantity);
    setInventory({ ...inventory, [itemId]: newStock });
    localStorage.setItem('inventory', JSON.stringify({ ...inventory, [itemId]: newStock }));
  };

  const restockInventory = (itemId, quantity) => {
    const currentStock = inventory[itemId] || 0;
    const newStock = currentStock + quantity;
    setInventory({ ...inventory, [itemId]: newStock });
    localStorage.setItem('inventory', JSON.stringify({ ...inventory, [itemId]: newStock }));
  };

  // Loyalty points
  const addLoyaltyPoints = (customerId, points) => {
    const currentPoints = loyaltyPoints[customerId] || 0;
    const newPoints = currentPoints + points;
    setLoyaltyPoints({ ...loyaltyPoints, [customerId]: newPoints });
    localStorage.setItem('loyalty_points', JSON.stringify({ ...loyaltyPoints, [customerId]: newPoints }));
  };

  const getLoyaltyPoints = (customerId) => loyaltyPoints[customerId] || 0;

  // Transfer entire order to another table
  const transferOrderToTable = (targetTableNumber) => {
    setTableNumber(targetTableNumber);
    setShowTableTransferModal(false);
    setTargetTable('');
  };

  // Get table status
  const getTableStatus = (tableNum) => {
    const config = tableConfig[tableNum];
    return config?.status || 'available';
  };

  // Get table capacity
  const getTableCapacity = (tableNum) => {
    const config = tableConfig[tableNum];
    return config?.capacity || 4;
  };

  // Update table config
  const updateTableConfig = (tableNum, updates) => {
    setTableConfig(prev => {
      const newConfig = {
        ...prev,
        [tableNum]: { ...prev[tableNum], ...updates }
      };
      localStorage.setItem('table_config', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  // Update table notes
  const updateTableNotes = (tableNum, notes) => {
    setTableNotes(prev => {
      const newNotes = { ...prev, [tableNum]: notes };
      localStorage.setItem('table_notes', JSON.stringify(newNotes));
      return newNotes;
    });
  };

  // Merge tables
  const mergeTables = (table1, table2) => {
    const mergeId = `M-${table1}-${table2}`;
    setTableMerges(prev => {
      const newMerges = { ...prev, [mergeId]: { table1, table2, createdAt: new Date().toISOString() } };
      localStorage.setItem('table_merges', JSON.stringify(newMerges));
      return newMerges;
    });
    setShowTableMergeModal(false);
    setMergeTable1('');
    setMergeTable2('');
  };

  // Assign table to customer
  const assignTableToCustomer = (tableNum, customerName) => {
    updateTableConfig(tableNum, { assignedCustomer: customerName, status: 'occupied' });
  };

  // Unassign table
  const unassignTable = (tableNum) => {
    updateTableConfig(tableNum, { assignedCustomer: null, status: 'available' });
  };

  const addModifierToItem = (uniqueId, modifier) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        const existingModifiers = i.modifiers || [];
        if (!existingModifiers.includes(modifier)) {
          return { ...i, modifiers: [...existingModifiers, modifier] };
        }
      }
      return i;
    }));
  };

  const removeModifierFromItem = (uniqueId, modifier) => {
    setCartItems(cartItems.map(i => {
      if (i.uniqueId === uniqueId) {
        return { ...i, modifiers: (i.modifiers || []).filter(m => m !== modifier) };
      }
      return i;
    }));
  };

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSeat, setDragOverSeat] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, seatId) => {
    e.preventDefault();
    setDragOverSeat(seatId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSeat(null);
  };

  const handleDrop = (e, targetSeatId) => {
    e.preventDefault();
    if (draggedItem && dragOverSeat !== null) {
      transferItemToSeat(draggedItem.uniqueId, targetSeatId);
    }
    setDraggedItem(null);
    setDragOverSeat(null);
  };
  const addSeat = () => {
    const newSeatId = seats.length + 1;
    setSeats([...seats, { id: newSeatId, name: `Seat ${newSeatId}` }]);
  };

  const mergeSeats = (sourceSeatId, targetSeatId) => {
    setCartItems(cartItems.map(item => 
      item.seatId === sourceSeatId ? { ...item, seatId: targetSeatId } : item
    ));
    setSeats(seats.filter(s => s.id !== sourceSeatId));
    if (selectedSeat === sourceSeatId) {
      setSelectedSeat(targetSeatId);
    }
  };

  const getItemsBySeat = (seatId) => {
    return cartItems.filter(item => item.seatId === seatId);
  };

  const getSeatTotal = (seatId) => {
    return getItemsBySeat(seatId).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getFilteredMenuItems = () => {
    let filtered = selectedCategory === 'All' 
      ? displayMenuItems 
      : displayMenuItems.filter(item => item.category === selectedCategory);
    
    if (menuSearch) {
      const searchLower = menuSearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.code && item.code.toLowerCase().includes(searchLower))
      );
    }
    return filtered;
  };

  // Send to kitchen
  const sendToKitchen = () => {
    if (cartItems.length === 0) return;

    const order = {
      id: `ORD-${Date.now()}`,
      tableNumber: tableNumber,
      guestCount: guestCount,
      items: cartItems,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: getTotal(),
      status: 'SENT_TO_KITCHEN',
      server: assignedServer,
      orderTiming,
      kitchenDelay,
      kitchenDelayReason,
      specialRequest: specialRequest,
      orderType: orderType,
      customerName: customerName,
      createdAt: new Date().toISOString()
    };

    // Create order using workflow service
    let workflowOrder;
    try {
      workflowOrder = orderWorkflowService.createOrder({
        id: order.id,
        tableId: tables?.find(t => t.number === parseInt(tableNumber))?.id || tableNumber,
        tableNumber: order.tableNumber,
        items: order.items,
        specialRequest: order.specialRequest,
        waiterId: assignedServer,
        orderType: order.orderType,
        customerName: order.customerName,
        guestCount: order.guestCount
      });
    } catch (error) {
      console.error('[ToastOrders] Failed to create order in workflow service:', error);
      alert('Failed to create order. Please try again.');
      return;
    }

    // Fire order to kitchen (with delay if configured)
    let kot;
    try {
      const fireOrder = () => {
        kot = orderWorkflowService.fireOrderToKitchen(
          workflowOrder,
          order.items.map(item => ({
            ...item,
            id: item.id,
            modifiers: item.modifiers || [],
            course: item.course,
            seatId: item.seatId
          })),
          tables?.find(t => t.number === parseInt(tableNumber))?.id || tableNumber,
          assignedServer
        );
      };

      if (kitchenDelay) {
        // Delay firing if kitchen delay is enabled
        setTimeout(fireOrder, ORDER_CONFIG.KITCHEN_DELAY_MINUTES * 60 * 1000);
        console.log('[ToastOrders] Order delayed by', ORDER_CONFIG.KITCHEN_DELAY_MINUTES, 'minutes due to:', kitchenDelayReason);
        alert(`Order delayed by ${ORDER_CONFIG.KITCHEN_DELAY_MINUTES} minutes. Reason: ${kitchenDelayReason}`);
      } else {
        fireOrder();
      }
    } catch (error) {
      console.error('[ToastOrders] Failed to fire order to kitchen:', error);
      alert('Failed to send order to kitchen. Please try again.');
      return;
    }

    // Generate token if configured
    const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
    if (mainSettings.enableTokens) {
      try {
        orderWorkflowService.generateToken(workflowOrder.id);
      } catch (error) {
        console.error('[ToastOrders] Failed to generate token:', error);
      }
    }

    // Create KOT
    try {
      const kotManager = getKOTManager();
      kotManager.createKOT({
        orderId: order.id,
        tableNumber: order.tableNumber,
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          modifiers: item.modifiers || [],
          price: item.price,
          course: item.course,
          seatId: item.seatId
        })),
        notes: specialRequest,
        createdAt: order.createdAt,
        server: assignedServer
      });
    } catch (error) {
      console.error('Failed to create KOT:', error);
    }

    // Auto-print KOT if enabled in settings
    if (mainSettings.autoPrintKOT !== false) {
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // Update table status to occupied
    if (tables && setTables) {
      setTables(prevTables => prevTables.map(table => {
        if (table.number === parseInt(tableNumber) || table.id === parseInt(tableNumber)) {
          return { ...table, status: 'occupied', orderId: order.id, currentOrder: order };
        }
        return table;
      }));
    }

    // Assign server to customer record
    if (assignedServer && customers && setCustomers) {
      setCustomers(prevCustomers => prevCustomers.map(customer => {
        if (customer.name === customerName) {
          return { ...customer, assignedServer: assignedServer, lastOrderDate: new Date().toISOString() };
        }
        return customer;
      }));
    }

    setOrders(prev => [...prev, order]);
    setCartItems([]);
    setSpecialRequest('');
    // Order sent successfully
  };

  // Split check functionality
  const splitCheck = () => {
    if (seats.length <= 1) {
      setShowConfirmModal(true);
      setConfirmMessage('Need at least 2 seats to split check');
      setConfirmAction(() => () => setShowConfirmModal(false));
      return;
    }
    
    // Show split check modal
    setShowSplitCheckModal(true);
  };

  // Clear order
  const clearOrder = () => {
    if (cartItems.length === 0) return;
    setShowConfirmModal(true);
    setConfirmMessage('Clear all items from order?');
    setConfirmAction(() => () => {
      setCartItems([]);
      setSpecialRequest('');
      setShowConfirmModal(false);
    });
  };

  // Hold order
  const holdOrder = () => {
    if (cartItems.length === 0) return;
    const heldOrder = {
      id: `HOLD-${Date.now()}`,
      tableNumber,
      guestCount,
      cartItems: cartItems,
      specialRequest,
      subtotal: getSubtotal(),
      total: getTotal(),
      heldAt: new Date().toISOString()
    };
    const existingHeldOrders = JSON.parse(localStorage.getItem('held_orders') || '[]');
    existingHeldOrders.push(heldOrder);
    localStorage.setItem('held_orders', JSON.stringify(existingHeldOrders));
    setCartItems([]);
    setSpecialRequest('');
    // Order held successfully
  };

  // Edit order item
  const editOrderItem = (uniqueId) => {
    const item = cartItems.find(i => i.uniqueId === uniqueId);
    if (item) {
      setSelectedItem(item);
      setShowEditItemModal(true);
    }
  };

  // Validation function
  const validateOrder = () => {
    if (cartItems.length === 0) {
      setShowConfirmModal(true);
      setConfirmMessage('Please add items to the order');
      setConfirmAction(() => () => setShowConfirmModal(false));
      return false;
    }
    if (!tableNumber) {
      setShowConfirmModal(true);
      setConfirmMessage('Please select a table');
      setConfirmAction(() => () => setShowConfirmModal(false));
      return false;
    }
    if (guestCount < 1) {
      setShowConfirmModal(true);
      setConfirmMessage('Please set guest count');
      setConfirmAction(() => () => setShowConfirmModal(false));
      return false;
    }
    return true;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S: Send to kitchen
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (cartItems.length > 0 && tableNumber && guestCount >= 1) {
          sendToKitchen();
        }
      }
      // Ctrl/Cmd + P: Pay
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (cartItems.length > 0 && tableNumber && guestCount >= 1) {
          handleCheckout();
        }
      }
      // Ctrl/Cmd + H: Hold order
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        holdOrder();
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowDiscountModal(false);
        setShowTipModal(false);
        setShowCustomerModal(false);
        setShowHeldOrders(false);
        setShowSplitPaymentModal(false);
        setShowModifiersPanel(false);
        setShowTableModal(false);
        setShowConfirmModal(false);
        setShowSplitCheckModal(false);
        setShowEditItemModal(false);
        setShowOrderDetailsModal(false);
        setShowOrderHistory(false);
        setShowPrintConfig(false);
        setShowServiceChargeModal(false);
        setShowCashDrawer(false);
        setShowItemDiscountModal(false);
        setShowSplitItemModal(false);
        setShowTransferItemModal(false);
        setShowVoidItemModal(false);
        setShowDuplicateOrderModal(false);
        setShowBulkActions(false);
      }
      // F: Focus search
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('input[placeholder="Search menu items..."]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    // Validate payment
    const paymentAmountNum = parseFloat(paymentAmount) || getTotal();
    if (paymentAmountNum < getTotal()) {
      alert('Payment amount is insufficient. Please enter a valid amount.');
      return;
    }

    if (cartItems.length === 0) {
      alert('No items in cart to pay for.');
      return;
    }

    // Update inventory atomically
    try {
      cartItems.forEach(item => {
        updateInventory(item.id, item.quantity);
      });
    } catch (error) {
      console.error('[ToastOrders] Failed to update inventory:', error);
      alert('Failed to update inventory. Please try again.');
      return;
    }

    // Add loyalty points
    if (customerName) {
      const customer = customers.find(c => c.name === customerName);
      if (customer) {
        const pointsEarned = Math.floor(getTotal() * ORDER_CONFIG.LOYALTY_POINTS_PER_RUPEE);
        addLoyaltyPoints(customer.id, pointsEarned);
      }
    }

    const newOrder = {
      id: `ORD-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      customerName: customerName || 'Guest',
      customerId: customerName ? customers.find(c => c.name === customerName)?.id : null,
      diningOption: orderType,
      items: cartItems,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: getTotal(),
      discount: discount > 0 ? getSubtotal() * discount / 100 : 0,
      serviceCharge: serviceCharge > 0 ? getServiceCharge() : 0,
      serviceChargePercentage: serviceCharge,
      notes: specialRequest,
      tableNumber: orderType === 'dine_in' ? tableNumber : null,
      status: 'COMPLETED',
      paymentMethod,
      paymentAmount: parseFloat(paymentAmount) || getTotal(),
      paymentStatus: 'PAID',
      tipAmount,
      discountPercentage: discount,
      taxExempt,
      taxExemptReason,
      server: assignedServer,
      orderTiming,
      kitchenDelay,
      kitchenDelayReason,
      loyaltyPointsEarned: customerName ? Math.floor(getTotal() * ORDER_CONFIG.LOYALTY_POINTS_PER_RUPEE) : 0,
      createdAt: new Date().toISOString()
    };

    // Process payment using workflow service
    try {
      orderWorkflowService.processPayment(newOrder.id, {
        method: paymentMethod,
        amount: parseFloat(paymentAmount) || getTotal(),
        tip: tipAmount,
        discount: discount > 0 ? getSubtotal() * discount / 100 : 0
      });
    } catch (error) {
      console.error('[ToastOrders] Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
      return;
    }

    // Mark order as completed
    try {
      orderWorkflowService.markOrderAsCompleted(newOrder.id);
    } catch (error) {
      console.error('[ToastOrders] Failed to mark order as completed:', error);
    }

    setOrders(prev => [...prev, newOrder]);
    setLastCompletedOrder(newOrder);
    setShowPaymentModal(false);
    setShowReceipt(true);

    // Auto-print receipt if enabled in settings
    const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
    if (mainSettings.receiptAutoPrint !== false) {
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // Send email receipt if customer email is available and Brevo API key is configured
    const customer = customers.find(c => c.name === customerName);
    if (customer?.email && mainSettings.brevoApiKey) {
      try {
        // Simple receipt HTML for email
        const receiptHTML = `
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="text-align: center;">${mainSettings.storeName || 'BakeryPOS'}</h2>
            <p><strong>Order #${newOrder.id}</strong></p>
            <p><strong>Date:</strong> ${new Date(newOrder.createdAt).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${newOrder.customerName}</p>
            <hr/>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><th style="text-align: left; border-bottom: 1px solid #ddd;">Item</th><th style="text-align: right; border-bottom: 1px solid #ddd;">Qty</th><th style="text-align: right; border-bottom: 1px solid #ddd;">Price</th></tr>
              ${newOrder.items.map(item => `
                <tr>
                  <td style="padding: 8px 0;">${item.name}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
            <hr/>
            <p><strong>Subtotal:</strong> ₹${newOrder.subtotal.toFixed(2)}</p>
            <p><strong>Tax:</strong> ₹${newOrder.tax.toFixed(2)}</p>
            <p><strong>Total:</strong> ₹${newOrder.total.toFixed(2)}</p>
            <p style="text-align: center; margin-top: 20px;">Thank you for your order!</p>
          </body>
          </html>
        `;
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': mainSettings.brevoApiKey
          },
          body: JSON.stringify({
            sender: {
              name: mainSettings.storeName || 'BakeryPOS',
              email: mainSettings.storeEmail || 'noreply@bakerypos.com'
            },
            to: [{
              email: customer.email,
              name: customerName
            }],
            subject: `Receipt for Order #${newOrder.id}`,
            htmlContent: receiptHTML
          })
        });
        if (response.ok) {
          console.log('Email receipt sent to:', customer.email);
        } else {
          console.error('Failed to send email receipt:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to send email receipt:', error);
        alert('Failed to send email receipt. Receipt is available in the app.');
      }
    }

    // Save to order history
    const orderHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
    orderHistory.push(newOrder);
    localStorage.setItem('order_history', JSON.stringify(orderHistory));

    // Update cash drawer if cash payment
    if (paymentMethod === 'CASH') {
      const paymentAmountNum = parseFloat(paymentAmount) || getTotal();
      const updatedCashDrawer = {
        ...cashDrawer,
        currentBalance: cashDrawer.currentBalance + paymentAmountNum,
        transactions: [...cashDrawer.transactions, {
          type: 'PAYMENT_RECEIVED',
          amount: paymentAmountNum,
          orderId: newOrder.id,
          timestamp: new Date().toISOString()
        }]
      };
      setCashDrawer(updatedCashDrawer);
      localStorage.setItem('cash_drawer', JSON.stringify(updatedCashDrawer));
    }

    // Update table status to cleaning after payment
    if (tables && setTables) {
      setTables(prevTables => prevTables.map(table => {
        if (table.number === parseInt(tableNumber) || table.id === parseInt(tableNumber)) {
          return { ...table, status: 'cleaning', orderId: null, currentOrder: null };
        }
        return table;
      }));
    }

    // Assign server to customer record
    if (assignedServer && customers && setCustomers) {
      setCustomers(prevCustomers => prevCustomers.map(customer => {
        if (customer.name === customerName) {
          return { ...customer, assignedServer: assignedServer, lastOrderDate: new Date().toISOString() };
        }
        return customer;
      }));
    }

    // Reset
    setCartItems([]);
    setCustomerName('');
    setSpecialRequest('');
    setDiscount(0);
    setTableNumber('');
    setTipAmount(0);
    setShowPaymentModal(false);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Main Layout - Responsive */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        height: '100%',
        flexDirection: screenSize === 'small' ? 'column' : 'row'
      }}>
        
        {/* Mobile Panel Navigation - Only show on small screens */}
        {screenSize === 'small' && (
          <div style={{
            display: 'flex',
            background: '#f8f9fa',
            borderBottom: '1px solid #e5e7eb',
            padding: '8px',
            gap: '8px'
          }}>
            <button
              onClick={() => setMobileActivePanel('order')}
              style={{
                flex: 1,
                padding: '10px',
                background: mobileActivePanel === 'order' ? '#2563eb' : '#ffffff',
                color: mobileActivePanel === 'order' ? '#ffffff' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Order
            </button>
            <button
              onClick={() => setMobileActivePanel('categories')}
              style={{
                flex: 1,
                padding: '10px',
                background: mobileActivePanel === 'categories' ? '#2563eb' : '#ffffff',
                color: mobileActivePanel === 'categories' ? '#ffffff' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Categories
            </button>
            <button
              onClick={() => setMobileActivePanel('menu')}
              style={{
                flex: 1,
                padding: '10px',
                background: mobileActivePanel === 'menu' ? '#2563eb' : '#ffffff',
                color: mobileActivePanel === 'menu' ? '#ffffff' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Menu
            </button>
          </div>
        )}
        
        {/* Left Panel - Order Details */}
        <div style={{
          width: screenSize === 'small' ? '100%' : '320px',
          height: screenSize === 'small' ? (mobileActivePanel === 'order' ? 'auto' : '0') : '100%',
          background: '#ffffff',
          display: screenSize === 'small' ? (mobileActivePanel === 'order' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRight: screenSize === 'small' ? 'none' : '1px solid #d1d5db',
          borderBottom: screenSize === 'small' ? '1px solid #d1d5db' : 'none',
          overflow: screenSize === 'small' ? 'visible' : 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            padding: screenSize === 'small' ? '12px' : '12px 16px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: screenSize === 'small' ? 'flex-start' : 'center',
            flexDirection: screenSize === 'small' ? 'column' : 'row',
            gap: screenSize === 'small' ? '8px' : '0'
          }}>
            <div>
              <div style={{ fontSize: screenSize === 'small' ? '16px' : '14px', fontWeight: '700', color: '#1a1a1a' }}>
                Toast Orders
              </div>
              {customerName && (
                <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', color: '#6b7280', marginTop: '2px' }}>
                  {customerName}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: screenSize === 'small' ? '6px' : '8px', alignItems: 'center', flexWrap: 'wrap', width: screenSize === 'small' ? '100%' : 'auto' }}>
              {/* Table Selector (Indicator) */}
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                style={{
                  padding: screenSize === 'small' ? '8px 12px' : '6px 12px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: screenSize === 'small' ? '12px' : '11px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>Table {i + 1}</option>
                ))}
              </select>

              {/* Table Mode Toggle */}
              <div style={{
                display: 'flex',
                background: '#e5e7eb',
                borderRadius: '6px',
                padding: '2px'
              }}>
                <button
                  onClick={() => setTableMode('per-seat')}
                  style={{
                    padding: screenSize === 'small' ? '6px 10px' : '4px 8px',
                    background: tableMode === 'per-seat' ? '#2563eb' : 'transparent',
                    color: tableMode === 'per-seat' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: screenSize === 'small' ? '11px' : '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Per Seat
                </button>
                <button
                  onClick={() => setTableMode('per-table')}
                  style={{
                    padding: screenSize === 'small' ? '6px 10px' : '4px 8px',
                    background: tableMode === 'per-table' ? '#2563eb' : 'transparent',
                    color: tableMode === 'per-table' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: screenSize === 'small' ? '11px' : '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Per Table
                </button>
              </div>

              <button
                onClick={() => setShowCustomerModal(true)}
                style={{
                  padding: screenSize === 'small' ? '8px 12px' : '6px 12px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '12px' : '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Customer
              </button>
              <button style={{
                padding: screenSize === 'small' ? '8px 12px' : '6px 12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '12px' : '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Actions
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            padding: '8px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button style={{
              padding: '4px 8px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              By seat
            </button>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
              style={{
                width: '30px',
                padding: '4px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center'
              }}
            />
            <button style={{
              padding: '4px 8px',
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Default tag
            </button>
            <button style={{
              padding: '4px 8px',
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Assign cu
            </button>
            <input
              type="text"
              placeholder="Special request..."
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '4px 8px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px'
              }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={cartSearch}
              onChange={(e) => setCartSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '4px 8px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px'
              }}
            />
            {selectedItems.length > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                style={{
                  padding: '4px 8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Bulk ({selectedItems.length})
              </button>
            )}
          </div>

          {/* Order Items by Seat - Only show in Per Seat mode */}
          {tableMode === 'per-seat' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {/* Shared Items */}
              {cartItems.filter(item => !item.seatId).length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                  padding: '8px 16px',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>
                    Shared
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    ₹{cartItems.filter(item => !item.seatId).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                {cartItems.filter(item => !item.seatId).map(item => (
                  <div
                    key={item.uniqueId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    style={{
                      padding: '8px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'grab',
                      background: draggedItem?.uniqueId === item.uniqueId ? '#e0e7ff' : 'transparent'
                    }}
                    onClick={() => editOrderItem(item.uniqueId)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>
                        {item.quantity} {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        Course {item.course || selectedCourse}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.uniqueId);
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {seats.map(seat => {
              const seatItems = cartItems.filter(item => item.seatId === seat.id);
              if (seatItems.length === 0 && !showSeatEditor) return null;
              return (
                <div 
                  key={seat.id} 
                  onDragOver={(e) => handleDragOver(e, seat.id)}
                  onDrop={(e) => handleDrop(e, seat.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    marginBottom: '12px',
                    border: dragOverSeat === seat.id ? '2px dashed #2563eb' : 'none',
                    borderRadius: '4px',
                    padding: dragOverSeat === seat.id ? '4px' : '0'
                  }}
                >
                  {/* Seat Header */}
                  <div style={{
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={seatItems.length > 0 && seatItems.every(item => selectedItems.includes(item.uniqueId))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const seatItemIds = seatItems.map(item => item.uniqueId);
                            setSelectedItems(prev => [...new Set([...prev, ...seatItemIds])]);
                          } else {
                            const seatItemIds = seatItems.map(item => item.uniqueId);
                            setSelectedItems(prev => prev.filter(id => !seatItemIds.includes(id)));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>
                        {seat.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {showSeatEditor && seats.length > 1 && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {seats.filter(s => s.id !== seat.id).map(otherSeat => (
                            <button
                              key={otherSeat.id}
                              onClick={() => mergeSeats(seat.id, otherSeat.id)}
                              style={{
                                padding: '2px 6px',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '9px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              → {otherSeat.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        ₹{getSeatTotal(seat.id).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => setSelectedSeat(seat.id)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                  
                  {/* Seat Items */}
                  {seatItems.map(item => (
                    <div
                      key={item.uniqueId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      style={{
                        padding: '8px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'grab',
                        background: draggedItem?.uniqueId === item.uniqueId ? '#e0e7ff' : 'transparent'
                      }}
                      onClick={() => editOrderItem(item.uniqueId)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>
                          {item.quantity} {item.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          Course {item.course || selectedCourse}
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                            {item.modifiers.join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForDiscount(item);
                              setShowItemDiscountModal(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fcd34d',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                            title="Discount"
                          >
                            %
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForSplit(item);
                              setShowSplitItemModal(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              border: '1px solid #93c5fd',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                            title="Split"
                          >
                            ↗
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.uniqueId);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {/* Add Seat Button - Only show in Per Seat mode */}
            {tableMode === 'per-seat' ? (
              <button
                onClick={addSeat}
                style={{
                  margin: '8px 16px',
                  padding: '8px',
                  background: '#ffffff',
                  color: '#2563eb',
                  border: '1px dashed #2563eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add a seat
              </button>
            ) : null}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {/* Per Table mode - Simple table-level order list */}
              {cartItems.map(item => (
                <div
                  key={item.uniqueId}
                  style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => editOrderItem(item.uniqueId)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>
                      {item.quantity} {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      Course {item.course || selectedCourse}
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                        {item.modifiers.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.uniqueId);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Total</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>₹{getTotal().toFixed(2)}</span>
            </div>
            {serviceCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Service charge ({serviceCharge}%)</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>₹{getServiceCharge().toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                {taxExempt ? 'Tax exempt' : 'Including tax 19%'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                {taxExempt ? '₹0.00' : `₹${getTax().toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{
            padding: '10px 12px',
            background: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button
              onClick={clearOrder}
              style={{
                width: '28px',
                height: '28px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              C
            </button>
            <button
              onClick={holdOrder}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Hold
            </button>
            <button
              onClick={() => setShowDuplicateOrderModal(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() => setShowHeldOrders(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Held
            </button>
            <button
              onClick={() => setShowOrderHistory(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              History
            </button>
            <button
              onClick={() => setShowPrintConfig(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Print
            </button>
            <button
              onClick={() => setShowTableModal(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Tables
            </button>
            <button
              onClick={() => setShowTableTransferModal(true)}
              style={{
                padding: '6px 10px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Transfer
            </button>
            <button
              onClick={() => setShowSeatEditor(!showSeatEditor)}
              style={{
                padding: '6px 10px',
                background: showSeatEditor ? '#2563eb' : '#ffffff',
                color: showSeatEditor ? '#ffffff' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {showSeatEditor ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Middle Panel - Categories */}
        <div style={{
          width: screenSize === 'small' ? '100%' : '120px',
          height: screenSize === 'small' ? (mobileActivePanel === 'categories' ? 'auto' : '0') : '100%',
          background: '#ffffff',
          display: screenSize === 'small' ? (mobileActivePanel === 'categories' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRight: screenSize === 'small' ? 'none' : '1px solid #d1d5db',
          borderBottom: screenSize === 'small' ? '1px solid #d1d5db' : 'none',
          overflow: screenSize === 'small' ? 'visible' : 'hidden'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '12px 8px',
                background: selectedCategory === category ? '#2563eb' : '#ffffff',
                color: selectedCategory === category ? '#ffffff' : '#1a1a1a',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Right Panel - Menu Items */}
        <div style={{
          flex: screenSize === 'small' ? 'none' : 1,
          width: screenSize === 'small' ? '100%' : 'auto',
          height: screenSize === 'small' ? (mobileActivePanel === 'menu' ? 'auto' : '0') : '100%',
          background: '#ffffff',
          display: screenSize === 'small' ? (mobileActivePanel === 'menu' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          overflow: screenSize === 'small' ? 'visible' : 'hidden'
        }}>
          {/* Course Selector */}
          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Select a course</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
                style={{
                  width: '40px',
                  padding: '4px 8px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              />
              <button style={{
                width: '24px',
                height: '24px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}>
                +
              </button>
              <button
                onClick={() => {
                  const nextCourse = Math.max(...courseSequence) + 1;
                  setCourseSequence([...courseSequence, nextCourse]);
                }}
                style={{
                  padding: '4px 8px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Add Course
              </button>
            </div>
          </div>
          
          {/* Course Sequence Display */}
          {courseSequence.length > 1 && (
            <div style={{
              padding: '8px 16px',
              background: '#eff6ff',
              borderBottom: '1px solid #bfdbfe'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a', marginRight: '8px' }}>
                Course Sequence:
              </span>
              {courseSequence.map((course, idx) => (
                <span key={course} style={{ 
                  display: 'inline-block',
                  padding: '2px 6px',
                  background: selectedCourse === course ? '#2563eb' : '#ffffff',
                  color: selectedCourse === course ? '#ffffff' : '#374151',
                  borderRadius: '3px',
                  fontSize: '10px',
                  margin: '0 2px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedCourse(course)}
                >
                  {course}
                </span>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <div style={{
            padding: '8px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <input
              type="text"
              placeholder="Search menu items..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#f8f9fa',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Recent Items */}
          {recentItems.length > 0 && (
            <div style={{
              padding: '8px 16px',
              background: '#f0fdf4',
              borderBottom: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                Recently Added
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {recentItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    style={{
                      padding: '4px 8px',
                      background: '#ffffff',
                      color: '#1a1a1a',
                      border: '1px solid #bbf7d0',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers Panel */}
          {showModifiersPanel && selectedItem && (
            <div style={{
              padding: '12px 16px',
              background: '#fffbeb',
              borderBottom: '1px solid #fcd34d'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                Modifiers for: {selectedItem.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {foodModifiers.map(modifier => (
                  <button
                    key={modifier}
                    onClick={() => addModifierToItem(selectedItem.uniqueId, modifier)}
                    style={{
                      padding: '4px 8px',
                      background: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {modifier}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setSelectedItemForSize(selectedItem);
                    setShowModifierPricingModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Add Pricing
                </button>
                <button
                  onClick={() => setShowModifiersPanel(false)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#ffffff',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Category Header */}
          <div style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
              {selectedCategory}
            </div>
            {selectedItem && (
              <button
                onClick={() => setShowModifiersPanel(!showModifiersPanel)}
                style={{
                  padding: '4px 8px',
                  background: showModifiersPanel ? '#2563eb' : '#f3f4f6',
                  color: showModifiersPanel ? '#ffffff' : '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                {showModifiersPanel ? 'Hide' : 'Show'} Modifiers
              </button>
            )}
          </div>

          {/* Menu Items Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            background: '#ffffff'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px' 
            }}>
              {getFilteredMenuItems().map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{
                    padding: '16px 12px',
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    minHeight: '80px',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>
                    ₹{item.price.toFixed(2)}
                  </div>
                  {item.category === 'Beers' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '3px',
                      background: '#f97316'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{
            padding: screenSize === 'small' ? '12px' : '12px 16px',
            background: '#f8f9fa',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: screenSize === 'small' ? '6px' : '8px',
            flexWrap: 'wrap',
            flexDirection: screenSize === 'small' ? 'column' : 'row'
          }}>
            <button
              onClick={() => {
                if (validateOrder()) sendToKitchen();
              }}
              disabled={cartItems.length === 0}
              style={{
                flex: screenSize === 'small' ? 'none' : 1,
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: cartItems.length > 0 ? '#ffffff' : '#e5e7eb',
                color: cartItems.length > 0 ? '#1a1a1a' : '#9ca3af',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: cartItems.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Send - {cartItems.length} Items
            </button>
            <button
              onClick={() => setShowDiscountModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Discount {discount > 0 ? `(${discount}%)` : ''}
            </button>
            <button
              onClick={() => setShowServiceChargeModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Service {serviceCharge > 0 ? `(${serviceCharge}%)` : ''}
            </button>
            <button
              onClick={() => setShowTipModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Tip {tipAmount > 0 ? `(₹${tipAmount.toFixed(2)})` : ''}
            </button>
            <button
              onClick={() => setShowCashDrawer(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cash Drawer
            </button>
            <button
              onClick={() => setShowServerAssignmentModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Server
            </button>
            <button
              onClick={() => setShowOrderTimingModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Timing
            </button>
            <button
              onClick={() => setShowTaxExemptionModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: taxExempt ? '#fef3c7' : '#ffffff',
                color: taxExempt ? '#92400e' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Tax {taxExempt ? '✓' : ''}
            </button>
            <button
              onClick={() => setShowKitchenDelayModal(true)}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: kitchenDelay ? '#fef3c7' : '#ffffff',
                color: kitchenDelay ? '#92400e' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Delay {kitchenDelay ? '✓' : ''}
            </button>
            <button
              onClick={splitCheck}
              disabled={seats.length <= 1}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: seats.length > 1 ? '#ffffff' : '#e5e7eb',
                color: seats.length > 1 ? '#374151' : '#9ca3af',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: seats.length > 1 ? 'pointer' : 'not-allowed'
              }}
            >
              Split check
            </button>
            <button
              onClick={() => {
                if (validateOrder()) handleCheckout();
              }}
              disabled={cartItems.length === 0}
              style={{
                width: screenSize === 'small' ? '100%' : 'auto',
                padding: screenSize === 'small' ? '14px' : '10px 16px',
                background: cartItems.length > 0 ? '#2563eb' : '#e5e7eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '12px',
                fontWeight: '600',
                cursor: cartItems.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Pay - ₹{getTotal().toFixed(2)}
            </button>
          </div>
        </div>
      </div>
      
      {/* Discount Modal */}
      {showDiscountModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#ffffff',
            padding: screenSize === 'small' ? '20px' : '24px',
            borderRadius: '8px',
            width: screenSize === 'small' ? '100%' : '450px',
            maxWidth: screenSize === 'small' ? '100%' : '90%',
            border: '2px solid #1a1a1a',
            maxHeight: screenSize === 'small' ? '90vh' : 'auto',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '20px' : '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Apply Discount</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Quick Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'None', value: 0, desc: 'No discount' },
                  { label: 'Customer', value: 5, desc: 'Customer courtesy' },
                  { label: 'Senior', value: 10, desc: 'Senior citizen' },
                  { label: 'Employee', value: 15, desc: 'Staff discount' },
                  { label: 'Manager', value: 20, desc: 'Manager special' },
                  { label: 'VIP', value: 25, desc: 'VIP customer' }
                ].map(({ label, value, desc }) => (
                  <button
                    key={label}
                    onClick={() => setDiscount(value)}
                    style={{
                      padding: '12px 8px',
                      background: discount === value ? '#2563eb' : '#f3f4f6',
                      color: discount === value ? '#ffffff' : '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{label}</div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>{value}%</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Custom Percentage</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="1"
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Discount Reason</label>
              <select
                value={discountReason || ''}
                onChange={(e) => setDiscountReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="">Select reason...</option>
                <option value="customer_service">Customer service</option>
                <option value="complaint">Complaint resolution</option>
                <option value="promotion">Promotional discount</option>
                <option value="special_occasion">Special occasion</option>
                <option value="regular_customer">Regular customer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ padding: screenSize === 'small' ? '16px' : '12px', background: '#f0fdf4', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', color: '#166534', marginBottom: '4px' }}>
                <strong>Discount Summary:</strong>
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', color: '#166534' }}>
                Subtotal: ₹{getSubtotal().toFixed(2)}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', color: '#166534' }}>
                Discount: -₹{(getSubtotal() * discount / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', color: '#166534', fontWeight: '600' }}>
                New Subtotal: ₹{getDiscountedSubtotal().toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setDiscount(0);
                  setDiscountReason('');
                }}
                style={{
                  width: screenSize === 'small' ? '100%' : 'auto',
                  padding: screenSize === 'small' ? '14px' : '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '15px' : 'auto'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                style={{
                  width: screenSize === 'small' ? '100%' : 'auto',
                  padding: screenSize === 'small' ? '14px' : '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '15px' : 'auto'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tip Modal */}
      {showTipModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '450px',
            maxWidth: '90%',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Add Tip</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Quick Percentage</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[10, 12, 15, 18, 20, 22, 25, 30].map(percent => {
                  const tipAmt = getSubtotal() * percent / 100;
                  return (
                    <button
                      key={percent}
                      onClick={() => setTipAmount(tipAmt)}
                      style={{
                        padding: '12px 8px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fcd34d',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>{percent}%</div>
                      <div style={{ fontSize: '9px', opacity: 0.7 }}>₹{tipAmt.toFixed(0)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Custom Amount (₹)</label>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>
                <strong>Tip Summary:</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                Bill Total: ₹{getTotal().toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                Tip Amount: ₹{tipAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                Final Total: ₹{(getTotal() + tipAmount).toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTipModal(false);
                  setTipAmount(0);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTipModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Held Orders Modal */}
      {showHeldOrders && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Held Orders</h3>
            {(() => {
              const heldOrders = JSON.parse(localStorage.getItem('held_orders') || '[]');
              if (heldOrders.length === 0) {
                return <p style={{ color: '#6b7280' }}>No held orders</p>;
              }
              return heldOrders.map((order, index) => (
                <div key={order.id} style={{ marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Table {order.tableNumber}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {order.cartItems.length} items - ₹{order.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      Held at: {new Date(order.heldAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setCartItems(order.cartItems);
                        setTableNumber(order.tableNumber);
                        setSpecialRequest(order.specialRequest);
                        const updatedHeldOrders = heldOrders.filter((_, i) => i !== index);
                        localStorage.setItem('held_orders', JSON.stringify(updatedHeldOrders));
                        setShowHeldOrders(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Resume Order
                    </button>
                    <button
                      onClick={() => {
                        const updatedHeldOrders = heldOrders.filter((_, i) => i !== index);
                        localStorage.setItem('held_orders', JSON.stringify(updatedHeldOrders));
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ));
            })()}
            <button
              onClick={() => setShowHeldOrders(false)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Customer Modal */}
      {showCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Assign Customer</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Or Select Existing Customer</label>
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
              />
              <select
                value=""
                onChange={(e) => {
                  const customer = getFilteredCustomers().find(c => c.id === e.target.value);
                  if (customer) setCustomerName(customer.name);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
              >
                <option value="">Select customer...</option>
                {getFilteredCustomers().map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const customer = customers.find(c => c.name === customerName);
                  if (customer) {
                    setSelectedCustomerForNotes(customer);
                    setShowCustomerNotesModal(true);
                  }
                }}
                disabled={!customerName}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: customerName ? '#2563eb' : '#e5e7eb',
                  color: customerName ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: customerName ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}
              >
                Add Notes
              </button>
              {customerName && (() => {
                const customer = customers.find(c => c.name === customerName);
                if (customer) {
                  const points = getLoyaltyPoints(customer.id);
                  return (
                    <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                      Loyalty Points: {points}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Split Payment Modal */}
      {showSplitPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Split Payment</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Total: ₹{getTotal().toFixed(2)}
              </div>
              {seats.filter(seat => getSeatTotal(seat.id) > 0).map(seat => (
                <div key={seat.id} style={{ 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{seat.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{getSeatTotal(seat.id).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={splitPayments[seat.id] || ''}
                      onChange={(e) => setSplitPayments({ ...splitPayments, [seat.id]: parseFloat(e.target.value) || 0 })}
                      style={{
                        flex: 1,
                        padding: '6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                    <select
                      style={{
                        padding: '6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSplitPaymentModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSplitPaymentModal(false);
                  handleCheckout();
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Process Payments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartTotal={getTotal()}
        discount={discount}
        tipAmount={tipAmount}
        onTipAmountChange={setTipAmount}
        gstRate={gstRate}
        onGstRateChange={setGstRate}
        onCheckout={handlePaymentComplete}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={setPaymentAmount}
        tipAmount={tipAmount}
        onTipAmountChange={setTipAmount}
      />
      
      {/* Order History Modal */}
      {showOrderHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Order History</h3>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search orders..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            {(() => {
              const orderHistory = getFilteredOrderHistory();
              if (orderHistory.length === 0) {
                return <p style={{ color: '#6b7280' }}>No order history</p>;
              }
              return orderHistory.slice().reverse().map(order => (
                <div key={order.id} style={{ 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {order.customerName} - Table {order.tableNumber}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    {order.items.length} items - {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setCartItems(order.items);
                        setTableNumber(order.tableNumber);
                        setCustomerName(order.customerName);
                        setSpecialRequest(order.notes);
                        setShowOrderHistory(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Reorder
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrderDetails(order);
                        setShowOrderDetailsModal(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ));
            })()}
            <button
              onClick={() => setShowOrderHistory(false)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Print Configuration Modal */}
      {showPrintConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Print Configuration</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Kitchen Printer</label>
              <select
                value={printConfig.kitchenPrinter}
                onChange={(e) => setPrintConfig({ ...printConfig, kitchenPrinter: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="default">Default Kitchen Printer</option>
                <option value="kitchen1">Kitchen Printer 1</option>
                <option value="kitchen2">Kitchen Printer 2</option>
                <option value="none">No Printer</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Bar Printer</label>
              <select
                value={printConfig.barPrinter}
                onChange={(e) => setPrintConfig({ ...printConfig, barPrinter: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="default">Default Bar Printer</option>
                <option value="bar1">Bar Printer 1</option>
                <option value="bar2">Bar Printer 2</option>
                <option value="none">No Printer</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Receipt Printer</label>
              <select
                value={printConfig.receiptPrinter}
                onChange={(e) => setPrintConfig({ ...printConfig, receiptPrinter: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="default">Default Receipt Printer</option>
                <option value="receipt1">Receipt Printer 1</option>
                <option value="receipt2">Receipt Printer 2</option>
                <option value="none">No Printer</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1a1a1a' }}>
                <input
                  type="checkbox"
                  checked={printConfig.autoPrint}
                  onChange={(e) => setPrintConfig({ ...printConfig, autoPrint: e.target.checked })}
                />
                Auto-print receipts
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Receipt Header</label>
              <input
                type="text"
                value={printConfig.receiptHeader}
                onChange={(e) => setPrintConfig({ ...printConfig, receiptHeader: e.target.value })}
                placeholder="Restaurant name or message"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Receipt Footer</label>
              <input
                type="text"
                value={printConfig.receiptFooter}
                onChange={(e) => setPrintConfig({ ...printConfig, receiptFooter: e.target.value })}
                placeholder="Thank you message"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={printConfig.showLogo}
                  onChange={(e) => setPrintConfig({ ...printConfig, showLogo: e.target.checked })}
                />
                Show logo on receipt
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={printConfig.showServer}
                  onChange={(e) => setPrintConfig({ ...printConfig, showServer: e.target.checked })}
                />
                Show server name
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1a1a1a' }}>
                <input
                  type="checkbox"
                  checked={printConfig.showTimestamp}
                  onChange={(e) => setPrintConfig({ ...printConfig, showTimestamp: e.target.checked })}
                />
                Show timestamp
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrintConfig(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('print_config', JSON.stringify(printConfig));
                  setShowPrintConfig(false);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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
      
      {/* Service Charge Modal */}
      {showServiceChargeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Service Charge</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Service Charge Percentage</label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                min="0"
                max="50"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'None', value: 0, desc: 'No service charge' },
                { label: 'Basic', value: 5, desc: 'Basic service' },
                { label: 'Standard', value: 10, desc: 'Standard service' },
                { label: 'Full', value: 15, desc: 'Full service' },
                { label: 'Premium', value: 18, desc: 'Premium service' },
                { label: 'Special', value: 20, desc: 'Special occasion' }
              ].map(({ label, value, desc }) => (
                <button
                  key={label}
                  onClick={() => setServiceCharge(value)}
                  style={{
                    padding: '12px 8px',
                    background: serviceCharge === value ? '#2563eb' : '#f3f4f6',
                    color: serviceCharge === value ? '#ffffff' : '#1a1a1a',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{label}</div>
                  <div style={{ fontSize: '9px', opacity: 0.7 }}>{value}%</div>
                </button>
              ))}
            </div>
            <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
                <strong>Service Charge Summary:</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                Subtotal: ₹{getSubtotal().toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                Service Charge: ₹{getServiceCharge().toFixed(2)} ({serviceCharge}%)
              </div>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
                Subtotal with Service: ₹{(getSubtotal() + getServiceCharge()).toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowServiceChargeModal(false);
                  setServiceCharge(0);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowServiceChargeModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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
      
      {/* Cash Drawer Modal */}
      {showCashDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Cash Drawer</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px', 
              marginBottom: '16px' 
            }}>
              <div style={{ 
                padding: '16px', 
                background: '#f0fdf4', 
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Starting Balance</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                  ₹{cashDrawer.startingBalance.toFixed(2)}
                </div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: '#eff6ff', 
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>Current Balance</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                  ₹{cashDrawer.currentBalance.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Set Starting Balance</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Enter amount"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter amount"]');
                    if (input && input.value) {
                      const amount = parseFloat(input.value);
                      setCashDrawer({
                        ...cashDrawer,
                        startingBalance: amount,
                        currentBalance: amount,
                        transactions: [{
                          type: 'STARTING_BALANCE',
                          amount,
                          timestamp: new Date().toISOString()
                        }]
                      });
                      localStorage.setItem('cash_drawer', JSON.stringify({
                        ...cashDrawer,
                        startingBalance: amount,
                        currentBalance: amount,
                        transactions: [{
                          type: 'STARTING_BALANCE',
                          amount,
                          timestamp: new Date().toISOString()
                        }]
                      }));
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Set
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Add Cash</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Enter amount"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelectorAll('input[placeholder="Enter amount"]')[1];
                    if (input && input.value) {
                      const amount = parseFloat(input.value);
                      setCashDrawer({
                        ...cashDrawer,
                        currentBalance: cashDrawer.currentBalance + amount,
                        transactions: [...cashDrawer.transactions, {
                          type: 'ADD_CASH',
                          amount,
                          timestamp: new Date().toISOString()
                        }]
                      });
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Remove Cash</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Enter amount"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelectorAll('input[placeholder="Enter amount"]')[2];
                    if (input && input.value) {
                      const amount = parseFloat(input.value);
                      setCashDrawer({
                        ...cashDrawer,
                        currentBalance: cashDrawer.currentBalance - amount,
                        transactions: [...cashDrawer.transactions, {
                          type: 'REMOVE_CASH',
                          amount,
                          timestamp: new Date().toISOString()
                        }]
                      });
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Recent Transactions</label>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '4px'
              }}>
                {cashDrawer.transactions.length === 0 ? (
                  <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px' }}>
                    No transactions yet
                  </div>
                ) : (
                  cashDrawer.transactions.slice().reverse().map((tx, idx) => (
                    <div key={idx} style={{ 
                      padding: '8px 12px', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600', color: tx.type === 'ADD_CASH' ? '#10b981' : tx.type === 'REMOVE_CASH' ? '#ef4444' : '#374151' }}>
                          {tx.type.replace('_', ' ')}
                        </span>
                        <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span style={{ fontWeight: '600' }}>
                        {tx.type === 'ADD_CASH' ? '+' : tx.type === 'REMOVE_CASH' ? '-' : ''}₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCashDrawer(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
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
      
      {/* Item Discount Modal */}
      {showItemDiscountModal && selectedItemForDiscount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Item Discount</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedItemForDiscount.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Original price: ₹{(selectedItemForDiscount.originalPrice || selectedItemForDiscount.price).toFixed(2)}
              </div>
              {selectedItemForDiscount.discountPercent > 0 && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Current discount: {selectedItemForDiscount.discountPercent}%
                </div>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Discount Percentage</label>
              <input
                type="number"
                defaultValue={selectedItemForDiscount.discountPercent || 0}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
                id="itemDiscountInput"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[0, 10, 15, 20, 25, 50].map(discount => (
                <button
                  key={discount}
                  onClick={() => {
                    const input = document.getElementById('itemDiscountInput');
                    if (input) input.value = discount;
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {discount}%
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowItemDiscountModal(false);
                  setSelectedItemForDiscount(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('itemDiscountInput');
                  if (input && selectedItemForDiscount) {
                    const discountPercent = parseFloat(input.value) || 0;
                    applyItemDiscount(selectedItemForDiscount.uniqueId, discountPercent);
                    setShowItemDiscountModal(false);
                    setSelectedItemForDiscount(null);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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
      
      {/* Split Item Modal */}
      {showSplitItemModal && selectedItemForSplit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Split Item</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedItemForSplit.name} (×{selectedItemForSplit.quantity})
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                ₹{(selectedItemForSplit.price * selectedItemForSplit.quantity).toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Split between seats</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {seats.map(seat => (
                  <label key={seat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      id={`split-seat-${seat.id}`}
                      defaultChecked={seat.id === selectedItemForSplit?.seatId}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px' }}>{seat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSplitItemModal(false);
                  setSelectedItemForSplit(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const selectedSeats = seats.filter(seat => {
                    const checkbox = document.getElementById(`split-seat-${seat.id}`);
                    return checkbox && checkbox.checked;
                  }).map(seat => seat.id);
                  
                  if (selectedSeats.length > 0 && selectedItemForSplit) {
                    splitItemBetweenSeats(selectedItemForSplit.uniqueId, selectedSeats);
                    setShowSplitItemModal(false);
                    setSelectedItemForSplit(null);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Split
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transfer Item Modal */}
      {showTransferItemModal && selectedItemForTransfer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Transfer Item</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedItemForTransfer.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Currently in: {seats.find(s => s.id === selectedItemForTransfer.seatId)?.name || 'Unknown'}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Transfer to seat</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {seats.filter(seat => seat.id !== selectedItemForTransfer.seatId).map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => {
                      if (selectedItemForTransfer) {
                        transferItemToSeat(selectedItemForTransfer.uniqueId, seat.id);
                        setShowTransferItemModal(false);
                        setSelectedItemForTransfer(null);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {seat.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTransferItemModal(false);
                  setSelectedItemForTransfer(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Void Item Modal */}
      {showVoidItemModal && selectedItemForVoid && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Void Item</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedItemForVoid.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                ₹{(selectedItemForVoid.price * selectedItemForVoid.quantity).toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Reason for void</label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="">Select reason...</option>
                <option value="customer_request">Customer request</option>
                <option value="mistake">Mistake</option>
                <option value="quality_issue">Quality issue</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="wrong_item">Wrong item</option>
                <option value="other">Other</option>
              </select>
            </div>
            {voidReason === 'other' && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Enter reason"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowVoidItemModal(false);
                  setSelectedItemForVoid(null);
                  setVoidReason('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (voidReason && selectedItemForVoid) {
                    voidItem(selectedItemForVoid.uniqueId, voidReason);
                    setShowVoidItemModal(false);
                    setSelectedItemForVoid(null);
                    setVoidReason('');
                  }
                }}
                disabled={!voidReason}
                style={{
                  padding: '8px 16px',
                  background: voidReason ? '#ef4444' : '#e5e7eb',
                  color: voidReason ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: voidReason ? 'pointer' : 'not-allowed'
                }}
              >
                Void
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Duplicate Order Modal */}
      {showDuplicateOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Duplicate Order</h3>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              This will duplicate all {cartItems.length} items in the current order.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Current total: ₹{getTotal().toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                New total after duplication: ₹{(getTotal() * 2).toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDuplicateOrderModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  duplicateOrder();
                  setShowDuplicateOrderModal(false);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
              Bulk Actions ({selectedItems.length} items selected)
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Apply Discount</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[0, 10, 15, 20, 25, 50].map(discount => (
                  <button
                    key={discount}
                    onClick={() => {
                      bulkDiscount(discount);
                      setShowBulkActions(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fcd34d',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {discount}%
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Transfer to Seat</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {seats.map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => {
                      bulkTransfer(seat.id);
                      setShowBulkActions(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#d1fae5',
                      color: '#065f46',
                      border: '1px solid #6ee7b7',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {seat.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Void Items</div>
              <div style={{ marginBottom: '8px' }}>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select reason...</option>
                  <option value="customer_request">Customer request</option>
                  <option value="mistake">Mistake</option>
                  <option value="quality_issue">Quality issue</option>
                  <option value="out_of_stock">Out of stock</option>
                  <option value="wrong_item">Wrong item</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (voidReason) {
                    bulkVoid(voidReason);
                    setShowBulkActions(false);
                    setVoidReason('');
                  }
                }}
                disabled={!voidReason}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: voidReason ? '#ef4444' : '#e5e7eb',
                  color: voidReason ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: voidReason ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                Void Selected Items
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setSelectedItems([]);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Size Variant Modal */}
      {showSizeVariantModal && selectedItemForSize && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Size Variant</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedItemForSize.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Current size: {selectedItemForSize.size || 'Regular'} - ₹{selectedItemForSize.price.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Select Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { size: 'Small', multiplier: 0.8 },
                  { size: 'Regular', multiplier: 1.0 },
                  { size: 'Large', multiplier: 1.2 },
                  { size: 'Extra Large', multiplier: 1.5 }
                ].map(({ size, multiplier }) => (
                  <button
                    key={size}
                    onClick={() => {
                      applySizeVariant(selectedItemForSize.uniqueId, size, multiplier);
                      setShowSizeVariantModal(false);
                      setSelectedItemForSize(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSizeVariantModal(false);
                  setSelectedItemForSize(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modifier Pricing Modal */}
      {showModifierPricingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Modifier Pricing</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Select Modifier</label>
              <select
                value={selectedModifier || ''}
                onChange={(e) => setSelectedModifier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              >
                <option value="">Select modifier...</option>
                {foodModifiers.map(modifier => (
                  <option key={modifier} value={modifier}>{modifier}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Additional Price (₹)</label>
              <input
                type="number"
                placeholder="Enter price"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModifierPricingModal(false);
                  setSelectedModifier(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const modifierPriceInputs = document.querySelectorAll('input[placeholder="Enter price"]');
                  const input = modifierPriceInputs[modifierPriceInputs.length - 1];
                  if (input && selectedModifier && selectedItemForSize) {
                    const price = parseFloat(input.value) || 0;
                    applyModifierPricing(selectedItemForSize.uniqueId, selectedModifier, price);
                    setShowModifierPricingModal(false);
                    setSelectedModifier(null);
                    setSelectedItemForSize(null);
                  }
                }}
                disabled={!selectedModifier}
                style={{
                  padding: '8px 16px',
                  background: selectedModifier ? '#2563eb' : '#e5e7eb',
                  color: selectedModifier ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedModifier ? 'pointer' : 'not-allowed'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Customer Notes Modal */}
      {showCustomerNotesModal && selectedCustomerForNotes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Customer Notes</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedCustomerForNotes.name}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Notes</label>
              <textarea
                value={customerNotes[selectedCustomerForNotes.id] || ''}
                onChange={(e) => setCustomerNotes({ ...customerNotes, [selectedCustomerForNotes.id]: e.target.value })}
                placeholder="Enter customer notes, preferences, allergies..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCustomerNotesModal(false);
                  setSelectedCustomerForNotes(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('customer_notes', JSON.stringify(customerNotes));
                  setShowCustomerNotesModal(false);
                  setSelectedCustomerForNotes(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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
      
      {/* Server Assignment Modal */}
      {showServerAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#ffffff',
            padding: screenSize === 'small' ? '20px' : '24px',
            borderRadius: '8px',
            width: screenSize === 'small' ? '100%' : '450px',
            maxWidth: screenSize === 'small' ? '100%' : '90%',
            border: '2px solid #1a1a1a',
            maxHeight: screenSize === 'small' ? '90vh' : 'auto',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '20px' : '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Assign Server</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Select from Staff</label>
              <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {staff.length > 0 ? staff.map(staffMember => (
                  <button
                    key={staffMember.id}
                    onClick={() => setAssignedServer(staffMember.name)}
                    style={{
                      padding: '12px 8px',
                      background: assignedServer === staffMember.name ? '#2563eb' : '#f3f4f6',
                      color: assignedServer === staffMember.name ? '#ffffff' : '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {staffMember.name}
                  </button>
                )) : ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa'].map(server => (
                  <button
                    key={server}
                    onClick={() => setAssignedServer(server)}
                    style={{
                      padding: '12px 8px',
                      background: assignedServer === server ? '#2563eb' : '#f3f4f6',
                      color: assignedServer === server ? '#ffffff' : '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {server}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Custom Server Name</label>
              <input
                type="text"
                value={assignedServer}
                onChange={(e) => setAssignedServer(e.target.value)}
                placeholder="Enter server name"
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                <strong>Server Information:</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Current Server: {assignedServer || 'Not assigned'}
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Order ID: ORD-{Date.now().toString().slice(-8)}
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Table: {tableNumber}
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '8px' }}>
                <strong>Tables Assigned to This Server:</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#166534' }}>
                {tables.filter(t => t.status === 'occupied' && t.assignedServer === assignedServer).map(t => t.name || `Table ${t.id}`).join(', ') || 'No tables assigned'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowServerAssignmentModal(false);
                  setAssignedServer('');
                }}
                style={{
                  padding: screenSize === 'small' ? '12px 20px' : '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (assignedServer) {
                    setShowServerAssignmentModal(false);
                  }
                }}
                disabled={!assignedServer}
                style={{
                  padding: screenSize === 'small' ? '12px 20px' : '8px 16px',
                  background: assignedServer ? '#2563eb' : '#e5e7eb',
                  color: assignedServer ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: assignedServer ? 'pointer' : 'not-allowed',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  fontWeight: '600'
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Timing Modal */}
      {showOrderTimingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '450px',
            maxWidth: '90%',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Order Timing</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Quick Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Quick', prep: 10, fire: 0, desc: 'Fast items' },
                  { label: 'Standard', prep: 15, fire: 0, desc: 'Standard prep' },
                  { label: 'Complex', prep: 25, fire: 5, desc: 'Complex dishes' },
                  { label: 'Custom', prep: 20, fire: 10, desc: 'Custom timing' },
                  { label: 'Long', prep: 30, fire: 15, desc: 'Long prep time' },
                  { label: 'VIP', prep: 45, fire: 20, desc: 'VIP service' }
                ].map(({ label, prep, fire, desc }) => (
                  <button
                    key={label}
                    onClick={() => setOrderTiming({ prepTime: prep, fireTime: fire })}
                    style={{
                      padding: '12px 8px',
                      background: orderTiming.prepTime === prep && orderTiming.fireTime === fire ? '#2563eb' : '#f3f4f6',
                      color: orderTiming.prepTime === prep && orderTiming.fireTime === fire ? '#ffffff' : '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{label}</div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>{prep}m prep / {fire}m fire</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Custom Timing</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#6b7280' }}>Prep Time (min)</label>
                  <input
                    type="number"
                    value={orderTiming.prepTime}
                    onChange={(e) => setOrderTiming({ ...orderTiming, prepTime: parseInt(e.target.value) || 15 })}
                    min="5"
                    max="60"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#6b7280' }}>Fire Time (min)</label>
                  <input
                    type="number"
                    value={orderTiming.fireTime}
                    onChange={(e) => setOrderTiming({ ...orderTiming, fireTime: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="60"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#4338ca', marginBottom: '4px' }}>
                <strong>Timing Summary:</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#4338ca' }}>
                Prep Time: {orderTiming.prepTime} minutes
              </div>
              <div style={{ fontSize: '12px', color: '#4338ca' }}>
                Fire Time: {orderTiming.fireTime} minutes
              </div>
              <div style={{ fontSize: '12px', color: '#4338ca' }}>
                Total Time: {orderTiming.prepTime + orderTiming.fireTime} minutes
              </div>
              <div style={{ fontSize: '12px', color: '#4338ca', fontWeight: '600' }}>
                Expected Ready: {new Date(Date.now() + (orderTiming.prepTime + orderTiming.fireTime) * 60000).toLocaleTimeString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderTimingModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOrderTimingModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Transfer Modal */}
      {showTableTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Transfer to Table</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Current Table: {tableNumber}</label>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Target Table</label>
              <input
                type="number"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                placeholder="Enter table number"
                min="1"
                max="50"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTableTransferModal(false);
                  setTargetTable('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (targetTable && targetTable !== tableNumber.toString()) {
                    transferOrderToTable(parseInt(targetTable));
                  }
                }}
                disabled={!targetTable || targetTable === tableNumber.toString()}
                style={{
                  padding: '8px 16px',
                  background: targetTable && targetTable !== tableNumber.toString() ? '#2563eb' : '#e5e7eb',
                  color: targetTable && targetTable !== tableNumber.toString() ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: targetTable && targetTable !== tableNumber.toString() ? 'pointer' : 'not-allowed'
                }}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Exemption Modal */}
      {showTaxExemptionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Tax Exemption</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1a1a1a' }}>
                <input
                  type="checkbox"
                  checked={taxExempt}
                  onChange={(e) => setTaxExempt(e.target.checked)}
                />
                Enable tax exemption for this order
              </label>
            </div>
            {taxExempt && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Reason</label>
                <select
                  value={taxExemptReason}
                  onChange={(e) => setTaxExemptReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select reason...</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="dine_in">Dine-in</option>
                  <option value="special_customer">Special customer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTaxExemptionModal(false);
                  setTaxExempt(false);
                  setTaxExemptReason('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTaxExemptionModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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
      
      {/* Kitchen Delay Modal */}
      {showKitchenDelayModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Kitchen Delay</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1a1a1a' }}>
                <input
                  type="checkbox"
                  checked={kitchenDelay}
                  onChange={(e) => setKitchenDelay(e.target.checked)}
                />
                Delay this order
              </label>
            </div>
            {kitchenDelay && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Reason</label>
                <select
                  value={kitchenDelayReason}
                  onChange={(e) => setKitchenDelayReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select reason...</option>
                  <option value="chef_busy">Chef busy</option>
                  <option value="equipment_issue">Equipment issue</option>
                  <option value="customer_request">Customer request</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowKitchenDelayModal(false);
                  setKitchenDelay(false);
                  setKitchenDelayReason('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowKitchenDelayModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
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

      {/* Table Selection Modal */}
      {showTableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '700px',
            maxWidth: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid #1a1a1a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>Table Management</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowTableMergeModal(true)}
                  style={{
                    padding: '6px 12px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Merge
                </button>
                <button
                  onClick={() => setShowTableEditModal(true)}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Occupied</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Reserved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#6b7280', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Cleaning</span>
              </div>
            </div>

            {/* Table Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => {
                const status = getTableStatus(tableNum);
                const capacity = getTableCapacity(tableNum);
                const notes = tableNotes[tableNum] || '';
                const config = tableConfig[tableNum] || {};
                const assignedCustomer = config.assignedCustomer || '';
                const isSelected = tableNumber === tableNum.toString();

                const statusColors = {
                  available: '#10b981',
                  occupied: '#ef4444',
                  reserved: '#f59e0b',
                  cleaning: '#6b7280'
                };

                return (
                  <div
                    key={tableNum}
                    onClick={() => {
                      if (status === 'available') {
                        setTableNumber(tableNum.toString());
                        setShowTableModal(false);
                      }
                    }}
                    style={{
                      padding: '12px',
                      background: isSelected ? '#2563eb' : '#ffffff',
                      border: `2px solid ${isSelected ? '#2563eb' : statusColors[status]}`,
                      borderRadius: '8px',
                      cursor: status === 'available' ? 'pointer' : 'not-allowed',
                      opacity: status === 'available' ? 1 : 0.7,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: '700', color: isSelected ? '#ffffff' : '#1a1a1a', marginBottom: '4px' }}>
                      T{tableNum}
                    </div>
                    <div style={{ fontSize: '10px', color: isSelected ? '#ffffff' : '#6b7280', marginBottom: '4px' }}>
                      {capacity} seats
                    </div>
                    <div style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: statusColors[status],
                      color: '#ffffff',
                      borderRadius: '4px',
                      textAlign: 'center',
                      textTransform: 'capitalize'
                    }}>
                      {status}
                    </div>
                    {notes && (
                      <div style={{
                        fontSize: '9px',
                        color: isSelected ? '#ffffff' : '#6b7280',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notes}
                      </div>
                    )}
                    {assignedCustomer && (
                      <div style={{
                        fontSize: '9px',
                        color: isSelected ? '#ffffff' : '#10b981',
                        marginTop: '4px',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        👤 {assignedCustomer}
                      </div>
                    )}
                    {status === 'available' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTableToAssign(tableNum);
                          setAssignCustomerName('');
                          setShowTableAssignModal(true);
                        }}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '4px',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fcd34d',
                          borderRadius: '4px',
                          fontSize: '9px',
                          cursor: 'pointer'
                        }}
                      >
                        Assign
                      </button>
                    )}
                    {status === 'occupied' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unassignTable(tableNum);
                        }}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '4px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fca5a5',
                          borderRadius: '4px',
                          fontSize: '9px',
                          cursor: 'pointer'
                        }}
                      >
                        Release
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTableModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
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

      {/* Table Edit Modal */}
      {showTableEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Edit Table Configuration</h3>

            {selectedTableForEdit ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Table {selectedTableForEdit}</label>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Status</label>
                  <select
                    value={getTableStatus(selectedTableForEdit)}
                    onChange={(e) => updateTableConfig(selectedTableForEdit, { status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a'
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Capacity (seats)</label>
                  <input
                    type="number"
                    value={getTableCapacity(selectedTableForEdit)}
                    onChange={(e) => updateTableConfig(selectedTableForEdit, { capacity: parseInt(e.target.value) || 4 })}
                    min="1"
                    max="20"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Assigned Customer</label>
                  <input
                    type="text"
                    value={tableConfig[selectedTableForEdit]?.assignedCustomer || ''}
                    onChange={(e) => updateTableConfig(selectedTableForEdit, { assignedCustomer: e.target.value })}
                    placeholder="Enter customer name"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Notes</label>
                  <textarea
                    value={tableNotes[selectedTableForEdit] || ''}
                    onChange={(e) => updateTableNotes(selectedTableForEdit, e.target.value)}
                    placeholder="Add notes about this table..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1a1a1a',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedTableForEdit(null)}
                    style={{
                      padding: '8px 16px',
                      background: '#e5e7eb',
                      color: '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTableForEdit(null);
                      setShowTableEditModal(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => (
                    <button
                      key={tableNum}
                      onClick={() => setSelectedTableForEdit(tableNum)}
                      style={{
                        padding: '12px',
                        background: '#f3f4f6',
                        color: '#1a1a1a',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      T{tableNum}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowTableEditModal(false)}
                    style={{
                      padding: '8px 16px',
                      background: '#e5e7eb',
                      color: '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table Assign Modal */}
      {showTableAssignModal && tableToAssign && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Assign Table</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Table {tableToAssign}</label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Customer Name</label>
              <input
                type="text"
                value={assignCustomerName}
                onChange={(e) => setAssignCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTableAssignModal(false);
                  setTableToAssign(null);
                  setAssignCustomerName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (assignCustomerName) {
                    assignTableToCustomer(tableToAssign, assignCustomerName);
                    setShowTableAssignModal(false);
                    setTableToAssign(null);
                    setAssignCustomerName('');
                  }
                }}
                disabled={!assignCustomerName}
                style={{
                  padding: '8px 16px',
                  background: assignCustomerName ? '#fef3c7' : '#e5e7eb',
                  color: assignCustomerName ? '#92400e' : '#9ca3af',
                  border: '1px solid #fcd34d',
                  borderRadius: '4px',
                  cursor: assignCustomerName ? 'pointer' : 'not-allowed'
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Merge Modal */}
      {showTableMergeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            border: '2px solid #1a1a1a'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Merge Tables</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Table 1</label>
              <input
                type="number"
                value={mergeTable1}
                onChange={(e) => setMergeTable1(e.target.value)}
                placeholder="Enter table number"
                min="1"
                max="20"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Table 2</label>
              <input
                type="number"
                value={mergeTable2}
                onChange={(e) => setMergeTable2(e.target.value)}
                placeholder="Enter table number"
                min="1"
                max="20"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>
                <strong>Merge Info:</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#065f46' }}>
                Tables {mergeTable1 || '?'} and {mergeTable2 || '?'} will be merged
              </div>
              <div style={{ fontSize: '12px', color: '#065f46' }}>
                Combined capacity: {mergeTable1 && mergeTable2 ? getTableCapacity(parseInt(mergeTable1)) + getTableCapacity(parseInt(mergeTable2)) : '-'} seats
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTableMergeModal(false);
                  setMergeTable1('');
                  setMergeTable2('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (mergeTable1 && mergeTable2 && mergeTable1 !== mergeTable2) {
                    mergeTables(parseInt(mergeTable1), parseInt(mergeTable2));
                  }
                }}
                disabled={!mergeTable1 || !mergeTable2 || mergeTable1 === mergeTable2}
                style={{
                  padding: '8px 16px',
                  background: mergeTable1 && mergeTable2 && mergeTable1 !== mergeTable2 ? '#10b981' : '#e5e7eb',
                  color: mergeTable1 && mergeTable2 && mergeTable1 !== mergeTable2 ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: mergeTable1 && mergeTable2 && mergeTable1 !== mergeTable2 ? 'pointer' : 'not-allowed'
                }}
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Confirm</h3>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>{confirmMessage}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Split Check Modal */}
      {showSplitCheckModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Split Check</h3>
            <div style={{ marginBottom: '16px' }}>
              {seats.filter(seat => getSeatTotal(seat.id) > 0).map(seat => (
                <div key={seat.id} style={{ 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{seat.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                    ₹{getSeatTotal(seat.id).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
              Total: ₹{getTotal().toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSplitCheckModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
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
      
      {/* Edit Item Modal */}
      {showEditItemModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#ffffff',
            padding: screenSize === 'small' ? '20px' : '24px',
            borderRadius: '8px',
            width: screenSize === 'small' ? '100%' : '400px',
            maxWidth: screenSize === 'small' ? '100%' : '90%',
            maxHeight: screenSize === 'small' ? '90vh' : 'auto',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '20px' : '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Edit Item</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Item</label>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                {selectedItem.name}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Quantity</label>
              <input
                type="number"
                value={selectedItem.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 1;
                  setCartItems(cartItems.map(i => 
                    i.uniqueId === selectedItem.uniqueId 
                      ? { ...i, quantity: newQuantity }
                      : i
                  ));
                }}
                min="1"
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Course</label>
              <input
                type="number"
                value={selectedItem.course}
                onChange={(e) => {
                  const newCourse = parseInt(e.target.value) || 1;
                  setCartItems(cartItems.map(i => 
                    i.uniqueId === selectedItem.uniqueId 
                      ? { ...i, course: newCourse }
                      : i
                  ));
                }}
                min="1"
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: screenSize === 'small' ? '15px' : '14px', display: 'block', marginBottom: '8px', color: '#1a1a1a' }}>Price (₹)</label>
              <input
                type="number"
                value={selectedItem.price}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  setCartItems(cartItems.map(i => 
                    i.uniqueId === selectedItem.uniqueId 
                      ? { ...i, price: newPrice }
                      : i
                  ));
                }}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  color: '#1a1a1a'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditItemModal(false)}
                style={{
                  padding: screenSize === 'small' ? '12px 20px' : '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditItemModal(false)}
                style={{
                  padding: screenSize === 'small' ? '12px 20px' : '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  fontWeight: '600'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrderDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Order Details</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedOrderDetails.customerName} - Table {selectedOrderDetails.tableNumber}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                {new Date(selectedOrderDetails.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Items</div>
              {selectedOrderDetails.items.map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '8px', 
                  background: '#f9fafb', 
                  borderRadius: '4px', 
                  marginBottom: '4px',
                  fontSize: '12px'
                }}>
                  {item.quantity} {item.name} - ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              ))}
            </div>
            <div style={{ 
              padding: '12px', 
              background: '#f3f4f6', 
              borderRadius: '4px', 
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Total: ₹{selectedOrderDetails.total.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
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

      {/* Receipt */}
      {showReceipt && lastCompletedOrder && (
        <Receipt
          order={lastCompletedOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
