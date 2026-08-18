import React, { useState, useMemo, useEffect } from 'react';
import Razorpay from 'razorpay';
import { useTerminal } from '../terminal/TerminalContext.jsx';
import { getKOTManager } from '../operations/KOTManager.js';
import { getKOTPrinter } from '../utils/KOTPrinter.js';

export default function SimplePOS({ orders = [], setOrders, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, settings = {}, setSettings, staff = [], tables = [], setTables }) {
  const { currentTerminal } = useTerminal();
  const posMode = settings.posMode || 'basic';
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantityInput, setQuantityInput] = useState('1');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(settings.gstRate || 18);
  
  // Initialize KOT manager
  const kotManager = getKOTManager();
  const kotPrinter = getKOTPrinter();
  
  useEffect(() => {
    kotManager.initialize();
  }, [kotManager]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Filter staff based on terminal assignment
  const availableStaff = useMemo(() => {
    if (!currentTerminal || !currentTerminal.assignedStaff || currentTerminal.assignedStaff.length === 0) {
      return staff; // If no terminal or no assignment, show all staff
    }
    return staff.filter(s => currentTerminal.assignedStaff.includes(s.id));
  }, [staff, currentTerminal]);
  
  const [selectedEmployee, setSelectedEmployee] = useState(availableStaff.length > 0 ? availableStaff[0] : null);
  const [heldOrders, setHeldOrders] = useState([]);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitPayments, setSplitPayments] = useState([]);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [activePanel, setActivePanel] = useState(null); // 'customer', 'table', 'notes', 'payment', 'promo'
  const [orderStartTime, setOrderStartTime] = useState(null);
  const [orderTimer, setOrderTimer] = useState(0);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'cart', 'customer', 'table', 'notes', 'payment', 'promo'
  const [numpadMode, setNumpadMode] = useState('quantity'); // 'quantity', 'discount', 'amount'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [customOrderName, setCustomOrderName] = useState('');
  const [customOrderPrice, setCustomOrderPrice] = useState('');
  const [customOrderQuantity, setCustomOrderQuantity] = useState('1');
  const [customOrderNotes, setCustomOrderNotes] = useState('');
  const [customOrderCategory, setCustomOrderCategory] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showGstSettings, setShowGstSettings] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [printKot, setPrintKot] = useState(true);
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(true);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal', 'custom', 'percentage'
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [numpadSearch, setNumpadSearch] = useState('');

  // Order timer effect
  useEffect(() => {
    let interval;
    if (cart.length > 0 && !orderStartTime) {
      setOrderStartTime(Date.now());
    } else if (cart.length === 0) {
      setOrderStartTime(null);
      setOrderTimer(0);
      return;
    }

    if (orderStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - orderStartTime) / 1000);
        setOrderTimer(elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [cart.length, orderStartTime]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const commonModifiers = [
    { id: 'extra', name: 'Extra', price: 10 },
    { id: 'no', name: 'No', price: 0 },
    { id: 'spicy', name: 'Spicy', price: 5 },
    { id: 'mild', name: 'Mild', price: 0 },
    { id: 'hot', name: 'Hot', price: 5 },
    { id: 'cold', name: 'Cold', price: 0 }
  ];

  const categories = ['All', 'Breads', 'Pastries', 'Cakes', 'Coffee', 'Beverages'];

  // Top 10 items for quick add shortcuts (0-9)
  const topItems = useMemo(() => {
    return menuItems
      .filter(item => item.active && !item.eightySixed)
      .slice(0, 10);
  }, [menuItems]);

  // Fuzzy search for menu items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => {
      if (!item.active || item.eightySixed) return false;
      const nameMatch = item.name.toLowerCase().includes(query);
      const codeMatch = item.code && item.code.toLowerCase().includes(query);
      const categoryMatch = item.category && item.category.toLowerCase().includes(query);
      return nameMatch || codeMatch || categoryMatch;
    }).slice(0, 10);
  }, [searchQuery, menuItems]);

  // Numpad search results
  const numpadSearchResults = useMemo(() => {
    if (!numpadSearch.trim()) return [];
    const query = numpadSearch.toLowerCase();
    return menuItems.filter(item => {
      if (!item.active || item.eightySixed) return false;
      const nameMatch = item.name.toLowerCase().includes(query);
      const codeMatch = item.code && item.code.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    }).slice(0, 5);
  }, [numpadSearch, menuItems]);

  // Customer lookup by phone
  const lookupCustomer = (phone) => {
    if (!phone.trim()) return null;
    return customers.find(c => c.phone === phone) || null;
  };

  // Smart category suggestion based on time of day
  const getSmartCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'Coffee'; // Morning
    if (hour >= 11 && hour < 14) return 'Breads'; // Lunch
    if (hour >= 14 && hour < 17) return 'Pastries'; // Afternoon
    if (hour >= 17 && hour < 21) return 'Cakes'; // Evening
    return 'All';
  };

  // Auto-select smart category on mount
  useEffect(() => {
    if (posMode === 'advanced' && selectedCategory === 'All') {
      setSelectedCategory(getSmartCategory());
    }
  }, [posMode]);

  // Auto-save cart to localStorage for recovery
  useEffect(() => {
    if (posMode === 'advanced' && cart.length > 0) {
      localStorage.setItem('pos_cart_backup', JSON.stringify(cart));
    }
  }, [cart, posMode]);

  // Restore cart on mount if available
  useEffect(() => {
    if (posMode === 'advanced') {
      const savedCart = localStorage.getItem('pos_cart_backup');
      if (savedCart && cart.length === 0) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (confirm('Restore previous cart?')) {
            setCart(parsedCart);
          }
        } catch (e) {
          console.error('Failed to restore cart:', e);
        }
      }
    }
  }, [posMode]);

  // Popular items for quick add
  const popularItems = useMemo(() => {
    return menuItems
      .filter(item => item.active && !item.eightySixed)
      .slice(0, 6)
      .map(item => ({ ...item, popular: true }));
  }, [menuItems]);

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item, quantity) => {
    const qty = parseInt(quantity) || 1;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && JSON.stringify(i.modifiers) === JSON.stringify(selectedModifiers));
      if (existing) {
        return prev.map(i => 
          i.id === item.id && JSON.stringify(i.modifiers) === JSON.stringify(selectedModifiers)
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      const modifierPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
      const variantPrice = selectedVariant ? selectedVariant.priceAdjustment : 0;
      return [...prev, { 
        ...item, 
        quantity: qty, 
        modifiers: selectedModifiers, 
        variant: selectedVariant,
        price: item.price + modifierPrice + variantPrice 
      }];
    });
    setQuantityInput('1');
    setSelectedModifiers([]);
    setSelectedVariant(null);
    
    // Auto-focus quantity input for rapid entry
    if (posMode === 'advanced') {
      setTimeout(() => {
        const qtyInput = document.querySelector('input[placeholder="Enter quantity"]');
        if (qtyInput) qtyInput.focus();
      }, 100);
    }
  };

  // Add custom order
  const addCustomOrder = () => {
    if (!customOrderName || !customOrderPrice) return;
    
    // Validate custom order
    const validationError = validateCustomOrder();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    const qty = parseInt(customOrderQuantity) || 1;
    const customItem = {
      id: `custom-${Date.now()}`,
      name: customOrderName,
      price: parseFloat(customOrderPrice) || 0,
      quantity: qty,
      notes: customOrderNotes,
      category: customOrderCategory || 'Custom',
      isCustom: true
    };
    setCart(prev => [...prev, customItem]);
    setShowCustomOrder(false);
    setCustomOrderName('');
    setCustomOrderPrice('');
    setCustomOrderQuantity('1');
    setCustomOrderNotes('');
    setCustomOrderCategory('');
  };

  const openModifiersModal = (item) => {
    setSelectedItemForModifiers(item);
    setSelectedModifiers([]);
    setShowModifiersModal(true);
  };

  const toggleModifier = (modifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === modifier.id);
      if (exists) {
        return prev.filter(m => m.id !== modifier.id);
      }
      return [...prev, modifier];
    });
  };

  const applyModifiers = () => {
    if (selectedItemForModifiers) {
      addToCart(selectedItemForModifiers, quantityInput);
      setShowModifiersModal(false);
      setSelectedItemForModifiers(null);
    }
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = (cartSubtotal * discount) / 100;
  const taxAmount = ((cartSubtotal - discountAmount) * gstRate) / 100;
  const cartTotal = cartSubtotal - discountAmount + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Validate workflow requirements
    const validationError = validateWorkflow();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setShowPaymentModal(true);
  };

  const validateWorkflow = () => {
    const workflowSteps = settings.workflowSteps || ['items', 'customer', 'table', 'payment'];
    
    // Check if items are in cart (always required)
    if (cart.length === 0) {
      return 'Cart is empty. Please add items before checkout.';
    }
    
    // Check customer requirement
    if (workflowSteps.includes('customer') && settings.requireCustomer) {
      if (!selectedCustomer && !settings.allowWalkIn) {
        return 'Customer selection is required. Please select a customer or enable walk-in customers in settings.';
      }
    }
    
    // Check table requirement
    if (workflowSteps.includes('table') && settings.requireTable) {
      if (!selectedTable && !settings.autoAssignTables) {
        return 'Table assignment is required. Please select a table or enable auto-assign in settings.';
      }
      // Auto-assign table if enabled
      if (!selectedTable && settings.autoAssignTables) {
        const availableTable = tables.find(t => t.status === 'available');
        if (availableTable) {
          setSelectedTable(availableTable);
        } else {
          return 'No available tables for auto-assignment. Please select a table manually.';
        }
      }
    }
    
    // Check discount limits
    if (settings.enableDiscount && discount > 0) {
      if (discount > settings.maxDiscountPercent) {
        return `Discount exceeds maximum allowed (${settings.maxDiscountPercent}%).`;
      }
      if (settings.requireManagerForHighDiscount && discount > settings.highDiscountThreshold) {
        // In a real system, this would prompt for manager credentials
        return 'High discount requires manager approval.';
      }
    }
    
    // Check payment method availability
    if (workflowSteps.includes('payment')) {
      const allowedMethods = settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI', 'SPLIT'];
      if (!allowedMethods.includes(paymentMethod)) {
        return `Payment method ${paymentMethod} is not allowed. Allowed methods: ${allowedMethods.join(', ')}`;
      }
    }
    
    return null; // No validation errors
  };

  const validateDiscount = (discountPercent) => {
    if (!settings.enableDiscount) {
      return 'Discounts are not enabled in settings.';
    }
    if (discountPercent > settings.maxDiscountPercent) {
      return `Maximum discount allowed is ${settings.maxDiscountPercent}%`;
    }
    if (settings.requireManagerForHighDiscount && discountPercent > settings.highDiscountThreshold) {
      return 'High discount requires manager approval.';
    }
    return null;
  };

  const validateHoldOrder = () => {
    if (!settings.enableHoldOrders) {
      return 'Hold orders are not enabled in settings.';
    }
    if (heldOrders.length >= settings.maxHoldOrders) {
      return `Maximum hold orders (${settings.maxHoldOrders}) reached. Please complete or clear held orders.`;
    }
    return null;
  };

  const validateCustomOrder = () => {
    if (!settings.enableCustomOrders) {
      return 'Custom orders are not enabled in settings.';
    }
    if (settings.requireApprovalForCustomOrders) {
      // In a real system, this would prompt for manager credentials
      return 'Custom orders require manager approval.';
    }
    if (settings.requireNotesForCustomOrders && !customOrderNotes) {
      return 'Notes are required for custom orders.';
    }
    return null;
  };

  const validateVoid = () => {
    if (!settings.enableVoid) {
      return 'Void functionality is not enabled in settings.';
    }
    if (settings.requireManagerForVoid) {
      // In a real system, this would prompt for manager credentials
      return 'Void requires manager approval.';
    }
    return null;
  };

  const processPayment = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // If payment method is CARD, UPI, or WALLET, use Razorpay
    if (['CARD', 'UPI', 'WALLET'].includes(paymentMethod)) {
      const razorpayKey = settings.razorpayKeyId || 'rzp_test_TNOHWmxS3Z0i8f';
      
      try {
        const options = {
          key: razorpayKey,
          amount: cartTotal * 100, // Amount in paise
          currency: 'INR',
          name: settings.storeName || 'BakeryPOS',
          description: 'Order Payment',
          order_id: null, // Optional - create order on server for better security
          handler: function(response) {
            // Payment successful
            completeOrder(response.razorpay_payment_id);
          },
          prefill: {
            name: selectedCustomer?.name || '',
            email: selectedCustomer?.email || '',
            contact: selectedCustomer?.phone || ''
          },
          theme: {
            color: '#667eea'
          },
          modal: {
            ondismiss: function() {
              // Handle modal dismiss
              console.log('Payment modal dismissed');
            }
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
        
        rzp.on('payment.failed', function(response) {
          alert('Payment failed: ' + response.error.description);
        });
      } catch (error) {
        console.error('Razorpay error:', error);
        alert('Payment initialization failed: ' + error.message);
      }
    } else {
      // Cash payment - complete directly
      completeOrder(null);
    }
  };

  const completeOrder = (paymentId) => {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const tokenNumber = settings.enableTokenSystem 
      ? `${settings.tokenPrefix || 'T'}-${Date.now().toString().slice(-4)}`
      : null;
    const newOrder = {
      id: orderNumber,
      orderNumber: orderNumber,
      token: tokenNumber,
      items: cart,
      total: cartTotal,
      subtotal: cartSubtotal,
      discount: discount,
      discountAmount: discountAmount,
      gstRate: gstRate,
      taxAmount: taxAmount,
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in',
      customerPhone: selectedCustomer?.phone || null,
      tableId: selectedTable?.id || null,
      tableNumber: selectedTable?.name || null,
      staffId: selectedEmployee?.id || null,
      staffName: selectedEmployee?.name || 'Unknown',
      terminal: currentTerminal?.name || 'Main',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      auditTrail: {
        created: new Date().toISOString(),
        createdBy: selectedEmployee?.id || 'system',
        paymentMethod: paymentMethod,
        paymentId: paymentId,
        terminalId: currentTerminal?.id || 'terminal_1'
      }
    };
    
    setOrders([...orders, newOrder]);
    setLastOrder(newOrder);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setPaymentMethod('CASH');
    setShowPaymentModal(false);
    setShowReceipt(true);

    // Create KOT for kitchen based on workflow settings
    if (settings.autoCreateKOT) {
      // Check if payment is required before KOT
      if (settings.requirePaymentBeforeKOT && !paymentId) {
        console.log('Payment required before KOT, skipping KOT creation');
      } else {
        const kotResult = kotManager.createKOT({
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          token: newOrder.token,
          items: newOrder.items,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          tableNumber: newOrder.tableNumber,
          staffId: newOrder.staffId,
          staffName: newOrder.staffName,
          terminal: newOrder.terminal,
          notes: newOrder.notes || ''
        });

        if (kotResult.success) {
          console.log('KOT created:', kotResult.kot.kotId);
          
          // Auto-print KOT if enabled
          if (settings.autoPrintKOT) {
            kotPrinter.printKOTForAllStations(kotResult.kot);
          }
        }
      }
    }

    // Auto-print receipt
    if (settings.autoPrintReceipt) {
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // Update table status to occupied with token
    if (selectedTable) {
      setTables(tables.map(t => 
        t.id === selectedTable.id 
          ? { ...t, status: 'occupied', currentToken: newOrder.token }
          : t
      ));
    }

    // Auto-deduct inventory
    cart.forEach(cartItem => {
      const inventoryItem = inventory.find(inv => inv.name === cartItem.name);
      if (inventoryItem) {
        const newQuantity = Math.max(0, inventoryItem.quantity - cartItem.quantity);
        setInventory(inventory.map(inv => 
          inv.id === inventoryItem.id 
            ? { ...inv, quantity: newQuantity, updatedAt: new Date().toISOString() }
            : inv
        ));
      }
    });
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    
    // Validate hold order
    const validationError = validateHoldOrder();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    const heldOrder = {
      id: Date.now(),
      cart: [...cart],
      customer: selectedCustomer ? { name: selectedCustomer.name, id: selectedCustomer.id } : null,
      table: selectedTable,
      discount,
      gstRate,
      timestamp: new Date().toISOString()
    };
    setHeldOrders([...heldOrders, heldOrder]);
    setCart([]);
    setDiscount(0);
    setGstRate(settings.gstRate || 18);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setShowHeldOrders(true);
  };

  const handleResumeOrder = (heldOrder) => {
    setCart(heldOrder.cart);
    setDiscount(heldOrder.discount);
    setGstRate(heldOrder.gstRate);
    setSelectedCustomer(heldOrder.customer);
    setSelectedTable(heldOrder.table);
    setHeldOrders(heldOrders.filter(h => h.id !== heldOrder.id));
  };

  const handleDeleteHeldOrder = (heldOrderId) => {
    setHeldOrders(heldOrders.filter(h => h.id !== heldOrderId));
  };

  const handleVoidLastItem = () => {
    if (cart.length === 0) return;
    
    // Validate void
    const validationError = validateVoid();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    if (window.confirm('Are you sure you want to void the last item?')) {
      setCart(cart.slice(0, -1));
    }
  };

  const freeTable = (tableId) => {
    setTables(tables.map(t => 
      t.id === tableId 
        ? { ...t, status: 'available' }
        : t
    ));
  };

  const cancelOrder = (orderId) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'CANCELLED' }
          : order
      ));
      alert('Order cancelled successfully');
    }
  };

  const reprintReceipt = (order) => {
    setLastOrder(order);
    setShowReceipt(true);
  };

  const handleQuickCodeSubmit = () => {
    const code = quickCodeInput.toUpperCase().trim();
    if (!code) return;
    
    const item = menuItems.find(m => m.code === code);
    if (item) {
      addToCart(item, quantityInput);
      setQuickCodeInput('');
    } else {
      alert(`Item with code "${code}" not found`);
    }
  };

  const handleQuickCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuickCodeSubmit();
    }
  };

  const handleSplitBill = () => {
    if (cart.length === 0) return;
    setShowSplitBillModal(true);
    setSplitAmount('');
    setSplitPayments([]);
    setSplitMode('equal');
  };

  const addSplitPayment = () => {
    const amount = parseFloat(splitAmount);
    if (isNaN(amount) || amount <= 0 || amount > cartTotal) return;
    
    const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + amount > cartTotal) return;
    
    setSplitPayments([...splitPayments, { 
      id: Date.now(), 
      amount, 
      method: paymentMethod,
      time: new Date().toISOString()
    }]);
    setSplitAmount('');
  };

  const splitEqually = (numPeople) => {
    const amountPerPerson = cartTotal / numPeople;
    const payments = [];
    for (let i = 0; i < numPeople; i++) {
      payments.push({
        id: Date.now() + i,
        amount: amountPerPerson,
        method: 'CASH',
        time: new Date().toISOString()
      });
    }
    setSplitPayments(payments);
  };

  const removeSplitPayment = (paymentId) => {
    setSplitPayments(splitPayments.filter(p => p.id !== paymentId));
  };

  const processSplitPayment = () => {
    const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPaid - cartTotal) > 0.01) return;
    
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const tokenNumber = `T-${Date.now().toString().slice(-4)}`;
    const newOrder = {
      id: orderNumber,
      orderNumber: orderNumber,
      token: tokenNumber,
      items: cart,
      total: cartTotal,
      subtotal: cartSubtotal,
      discount: discount,
      discountAmount: discountAmount,
      gstRate: gstRate,
      taxAmount: taxAmount,
      paymentMethod: 'SPLIT',
      splitPayments: splitPayments,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in',
      tableId: selectedTable?.id || null,
      tableName: selectedTable?.name || null,
      staffId: selectedEmployee?.id || null,
      staffName: selectedEmployee?.name || 'Unknown',
      terminal: currentTerminal?.name || 'Main',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    
    setOrders([...orders, newOrder]);
    setLastOrder(newOrder);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setPaymentMethod('CASH');
    setShowSplitBillModal(false);
    setSplitPayments([]);
    setShowReceipt(true);

    // Create KOT for kitchen
    const kotResult = kotManager.createKOT({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      token: newOrder.token,
      items: newOrder.items,
      customerName: newOrder.customerName,
      customerPhone: selectedCustomer?.phone || null,
      tableNumber: newOrder.tableName,
      staffId: newOrder.staffId,
      staffName: newOrder.staffName,
      terminal: newOrder.terminal,
      notes: ''
    });

    if (kotResult.success) {
      console.log('KOT created for split payment:', kotResult.kot.kotId);
      
      // Auto-print KOT for all stations
      kotPrinter.printKOTForAllStations(kotResult.kot);
    }

    // Update table status to occupied with token
    if (selectedTable) {
      setTables(tables.map(t => 
        t.id === selectedTable.id 
          ? { ...t, status: 'occupied', currentToken: newOrder.token }
          : t
      ));
    }

    // Auto-deduct inventory
    cart.forEach(cartItem => {
      const inventoryItem = inventory.find(inv => inv.name === cartItem.name);
      if (inventoryItem) {
        const newQuantity = Math.max(0, inventoryItem.quantity - cartItem.quantity);
        setInventory(inventory.map(inv => 
          inv.id === inventoryItem.id 
            ? { ...inv, quantity: newQuantity, updatedAt: new Date().toISOString() }
            : inv
        ));
      }
    });
  };

  const printReceipt = () => {
    if (!lastOrder) return;
    
    const subtotal = lastOrder.subtotal || lastOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmt = lastOrder.discountAmount || (subtotal * (lastOrder.discount || 0)) / 100;
    const taxAmt = lastOrder.taxAmount || ((subtotal - discountAmt) * (lastOrder.gstRate || 0)) / 100;
    
    const template = settings.receiptTemplate || 'standard';
    const fontSize = settings.receiptFontSize || '12';
    
    // Build header based on template
    let headerHTML = '';
    if (template === 'custom' && settings.customReceiptHeader) {
      headerHTML = settings.customReceiptHeader
        .replace(/{storeName}/g, settings.storeName || '🥐 BakeryPOS')
        .replace(/{storeAddress}/g, settings.storeAddress || '')
        .replace(/{phone}/g, settings.phone || '');
    } else if (settings.showLogoOnReceipt !== false) {
      headerHTML = `
        <div class="header">
          <h1>${settings.storeName || '🥐 BakeryPOS'}</h1>
          ${settings.storeAddress ? `<p>${settings.storeAddress}</p>` : ''}
          ${settings.phone ? `<p>${settings.phone}</p>` : ''}
        </div>
      `;
    }
    
    // Build order info
    const orderInfoHTML = `
      <p>Receipt #${lastOrder.id}</p>
      <p>Token: <strong>${lastOrder.token || 'N/A'}</strong></p>
      <p>${new Date(lastOrder.createdAt).toLocaleString()}</p>
      ${settings.showTableOnReceipt !== false && lastOrder.tableNumber ? `<p>Table: ${lastOrder.tableNumber}</p>` : ''}
      ${settings.showCustomerOnReceipt !== false ? `<p>Customer: ${lastOrder.customerName || 'Walk-in'}</p>` : ''}
    `;
    
    // Build items
    const itemsHTML = lastOrder.items.map(item => `
      <div class="item">
        <span>${item.name}${item.isCustom ? ' (Custom)' : ''} x${item.quantity}</span>
        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
      </div>
      ${item.notes ? `<div class="item" style="font-size: 10px; color: #666; font-style: italic;">Note: ${item.notes}</div>` : ''}
    `).join('');
    
    // Build totals
    let totalsHTML = `
      <div class="item">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
    `;
    
    if (settings.showGstOnReceipt !== false) {
      if ((lastOrder.discount || 0) > 0) {
        totalsHTML += `
          <div class="item discount">
            <span>Discount (${lastOrder.discount}%)</span>
            <span>-₹${discountAmt.toFixed(2)}</span>
          </div>
        `;
      }
      if ((lastOrder.gstRate || 0) > 0) {
        totalsHTML += `
          <div class="item tax">
            <span>GST (${lastOrder.gstRate}%)</span>
            <span>₹${taxAmt.toFixed(2)}</span>
          </div>
        `;
      }
    }
    
    totalsHTML += `
      <div class="item" style="margin-top: 10px; font-size: 14px;">
        <span>TOTAL</span>
        <span>₹${lastOrder.total.toFixed(2)}</span>
      </div>
      <div class="item" style="margin-top: 5px; font-size: 12px;">
        <span>Payment: ${lastOrder.paymentMethod}</span>
      </div>
    `;
    
    // Build footer
    let footerHTML = '';
    if (template === 'custom' && settings.customReceiptFooter) {
      footerHTML = settings.customReceiptFooter.replace(/{receiptFooter}/g, settings.receiptFooter || 'Thank you for your order!');
    } else {
      footerHTML = `
        <div class="footer">
          <p>${settings.receiptFooter || 'Thank you for your order!'}</p>
          <p>Visit us again soon</p>
        </div>
      `;
    }
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${lastOrder.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: ${fontSize}px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; }
            .header p { margin: 5px 0; font-size: 12px; }
            .store-info { margin-bottom: 15px; font-size: 11px; color: #666; }
            .items { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; }
            .discount { color: green; }
            .tax { color: orange; }
          </style>
        </head>
        <body>
          ${headerHTML}
          ${orderInfoHTML}
          <div class="items">
            ${itemsHTML}
          </div>
          <div class="total">
            ${totalsHTML}
          </div>
          ${footerHTML}
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleNumpadClick = (value) => {
    if (value === 'C') {
      if (numpadMode === 'quantity') setQuantityInput('1');
      else if (numpadMode === 'discount') setDiscount(0);
      else if (numpadMode === 'amount') setQuantityInput('0');
    } else if (value === '⌫') {
      if (numpadMode === 'quantity') {
        setQuantityInput(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
      } else if (numpadMode === 'discount') {
        setDiscount(0);
      } else if (numpadMode === 'amount') {
        setQuantityInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      }
    } else {
      if (numpadMode === 'quantity') {
        setQuantityInput(prev => prev === '0' ? value : prev + value);
      } else if (numpadMode === 'discount') {
        const newValue = parseInt(value);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
          setDiscount(newValue);
        }
      } else if (numpadMode === 'amount') {
        setQuantityInput(prev => prev === '0' ? value : prev + value);
      }
    }
  };

  // Keyboard shortcuts for advanced mode (added after function definitions)
  useEffect(() => {
    if (posMode !== 'advanced') return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Allow some shortcuts even in inputs
        if (e.key === 'Escape') {
          setShowPaymentModal(false);
          setShowModifiersModal(false);
          setShowOrderHistory(false);
          setShowSplitBillModal(false);
        }
        return;
      }

      // F1 - Help/Shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        alert('Keyboard Shortcuts:\nF1 - Help\nF2 - Checkout\nF3 - Hold Order\nF4 - Void Last Item\nF5 - Discount Toggle\nF6 - Tax Toggle\nF7 - Print Receipt\nF8 - Order History\nF9 - Quick Code Focus\nF10 - Clear Cart\nF11 - Fullscreen\nF12 - Settings\n1-6 - Quick Actions\nEscape - Close Modals\nEnter - Add Item (if selected)');
      }
      // F2 - Checkout
      else if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      }
      // F3 - Hold Order
      else if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0) {
          const heldOrder = {
            id: Date.now(),
            cart: [...cart],
            discount: discount,
            gstRate: gstRate,
            timestamp: new Date().toISOString()
          };
          setHeldOrders([...heldOrders, heldOrder]);
          setCart([]);
          setDiscount(0);
          setSelectedCustomer(null);
          setSelectedTable(null);
        }
      }
      // F4 - Void Last Item
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Are you sure you want to void the last item?')) {
          setCart(cart.slice(0, -1));
        }
      }
      // F5 - Discount Toggle
      else if (e.key === 'F5') {
        e.preventDefault();
        setDiscount(discount === 0 ? 10 : 0);
      }
      // F6 - Tax Toggle
      else if (e.key === 'F6') {
        e.preventDefault();
        setGstRate(gstRate === 0 ? 18 : 0);
      }
      // F7 - Print Receipt
      else if (e.key === 'F7') {
        e.preventDefault();
        if (lastOrder) {
          const subtotal = lastOrder.subtotal || lastOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const discountAmt = lastOrder.discountAmount || (subtotal * (lastOrder.discount || 0)) / 100;
          const taxAmt = lastOrder.taxAmount || ((subtotal - discountAmt) * (lastOrder.gstRate || 0)) / 100;
          
          const receiptWindow = window.open('', '_blank');
          receiptWindow.document.write(`
            <html>
              <head>
                <title>Receipt - ${lastOrder.id}</title>
                <style>
                  body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .header h1 { margin: 0; font-size: 18px; }
                  .header p { margin: 5px 0; font-size: 12px; }
                  .store-info { margin-bottom: 15px; font-size: 11px; color: #666; }
                  .items { margin: 20px 0; }
                  .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                  .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px; font-weight: bold; }
                  .footer { text-align: center; margin-top: 30px; font-size: 11px; }
                  .discount { color: green; }
                  .tax { color: orange; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${settings.storeName || '🥐 BakeryPOS'}</h1>
                  ${settings.storeAddress ? `<p>${settings.storeAddress}</p>` : ''}
                  ${settings.phone ? `<p>${settings.phone}</p>` : ''}
                  <p>Receipt #${lastOrder.id}</p>
                  <p>${new Date(lastOrder.createdAt).toLocaleString()}</p>
                </div>
                <div class="items">
                  ${lastOrder.items.map(item => `
                    <div class="item">
                      <span>${item.name} x${item.quantity}</span>
                      <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="total">
                  <div class="item">
                    <span>Subtotal</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                  </div>
                  ${(lastOrder.discount || 0) > 0 ? `
                  <div class="item discount">
                    <span>Discount (${lastOrder.discount}%)</span>
                    <span>-₹${discountAmt.toFixed(2)}</span>
                  </div>
                  ` : ''}
                  ${(lastOrder.gstRate || 0) > 0 ? `
                  <div class="item tax">
                    <span>Tax (${lastOrder.gstRate}%)</span>
                    <span>₹${taxAmt.toFixed(2)}</span>
                  </div>
                  ` : ''}
                  <div class="item" style="margin-top: 10px; font-size: 14px;">
                    <span>TOTAL</span>
                    <span>₹${lastOrder.total.toFixed(2)}</span>
                  </div>
                  <div class="item" style="margin-top: 5px; font-size: 12px;">
                    <span>Payment: ${lastOrder.paymentMethod}</span>
                  </div>
                </div>
                <div class="footer">
                  <p>${settings.receiptFooter || 'Thank you for your order!'}</p>
                  <p>Visit us again soon</p>
                </div>
              </body>
            </html>
          `);
          receiptWindow.document.close();
          receiptWindow.print();
        }
      }
      // F8 - Order History
      else if (e.key === 'F8') {
        e.preventDefault();
        setShowOrderHistory(true);
      }
      // F9 - Quick Code Focus
      else if (e.key === 'F9') {
        e.preventDefault();
        const quickCodeInput = document.querySelector('input[placeholder*="Quick code"]');
        if (quickCodeInput) quickCodeInput.focus();
      }
      // F10 - Clear Cart
      else if (e.key === 'F10') {
        e.preventDefault();
        if (confirm('Clear entire cart?')) {
          setCart([]);
          setDiscount(0);
        }
      }
      // F11 - Fullscreen
      else if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
      // F12 - Settings (placeholder)
      else if (e.key === 'F12') {
        e.preventDefault();
        alert('Settings panel would open here');
      }
      // Number keys 0-9 for quick add shortcuts
      else if (e.key >= '0' && e.key <= '9') {
        const itemIndex = parseInt(e.key);
        if (topItems[itemIndex]) {
          addToCart(topItems[itemIndex], quantityInput);
        }
      }
      // Escape - Close all modals
      else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowModifiersModal(false);
        setShowOrderHistory(false);
        setShowSplitBillModal(false);
      }
      // Ctrl/Cmd + B - Focus search/quick code
      else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        const quickCodeInput = document.querySelector('input[placeholder*="Quick code"]');
        if (quickCodeInput) quickCodeInput.focus();
      }
      // Ctrl/Cmd + K - Clear cart
      else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (confirm('Clear entire cart?')) {
          setCart([]);
          setDiscount(0);
        }
      }
      // Ctrl/Cmd + Enter - Checkout
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posMode, cart, discount, gstRate, lastOrder, heldOrders, settings]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f3f4f6',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Professional Header */}
      <div style={{
        background: '#ffffff',
        padding: '8px 16px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: '#2563eb',
              letterSpacing: '-0.5px'
            }}>
              POS
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '3px 8px',
              borderRadius: '8px'
            }}>
              Advanced Mode
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {posMode === 'advanced' && (
              <>
                <button
                  onClick={() => alert('Keyboard Shortcuts:\nF1 - Help\nF2 - Checkout\nF3 - Hold Order\nF4 - Void Last Item\nF5 - Discount Toggle\nF6 - GST Toggle\nF7 - Print Receipt\nF8 - Order History\nF9 - Search Focus\nF10 - Clear Cart\nF11 - Fullscreen\n0-9 - Quick Add Items\nEscape - Close Modals\nCtrl+B - Search\nCtrl+K - Clear Cart\nCtrl+Enter - Checkout')}
                  style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Press F1 for shortcuts"
                >
                  ⌨️ Shortcuts
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  placeholder="Search..."
                  style={{
                    padding: '6px 8px',
                    background: '#f9fafb',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    width: '150px'
                  }}
                />
                <button
                  onClick={() => setShowCustomerLookup(true)}
                  style={{
                    padding: '6px 8px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  👤 Customer
                </button>
              </>
            )}
            {cart.length > 0 && (
              <div style={{
                background: '#dbeafe',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#1e40af',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                ⏱ {formatTimer(orderTimer)}
              </div>
            )}
            <button
              onClick={() => setShowOrderHistory(true)}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {screenSize === 'small' && (
        <div style={{
          display: 'flex',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '4px',
          gap: '4px'
        }}>
          {[
            { id: 'menu', label: '🍕 Menu' },
            { id: 'cart', label: `🛒 Cart (${cartCount})` },
            { id: 'keypad', label: '🔢 Keypad & Actions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: activeView === tab.id ? '#2563eb' : 'transparent',
                color: activeView === tab.id ? '#ffffff' : '#374151',
                border: activeView === tab.id ? 'none' : '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content - Three Column Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '8px',
        padding: '8px',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Left Column - Menu */}
        {(screenSize !== 'small' || activeView === 'menu') && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            minWidth: screenSize === 'small' ? '0' : '300px'
          }}>
          {/* Categories */}
          <div style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '6px 12px',
                    background: selectedCategory === category ? '#2563eb' : '#f3f4f6',
                    color: selectedCategory === category ? '#ffffff' : '#374151',
                    border: selectedCategory === category ? 'none' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '8px'
              }}>
                {searchResults.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      addToCart(item, quantityInput);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = '#ffffff'}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.category}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                      ₹{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu Grid */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: '12px'
            }}>
              {filteredItems.map(item => {
                const inventoryItem = inventory.find(inv => inv.name === item.name);
                const isLowStock = inventoryItem && inventoryItem.quantity < 10;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item, quantityInput)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: item.active && !item.eightySixed ? 1 : 0.5,
                      border: item.active && !item.eightySixed ? 
                            (isLowStock ? '2px solid #f59e0b' : '1px solid #e5e7eb') : 
                            '1px solid #e5e7eb',
                      cursor: item.active && !item.eightySixed ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      minHeight: '120px'
                    }}
                    onMouseEnter={(e) => {
                      if (item.active && !item.eightySixed) {
                        e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.active && !item.eightySixed) {
                        e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        e.target.style.borderColor = isLowStock ? '#f59e0b' : '#e5e7eb';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {isLowStock && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#f59e0b',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        Low
                      </div>
                    )}
                    <span style={{ fontSize: '32px' }}>{item.emoji || '🥐'}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#1f2937',
                      textAlign: 'center',
                      lineHeight: '1.3'
                    }}>
                      {item.name}
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#2563eb'
                    }}>
                      ₹{item.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* Middle Column - Cart */}
        {(screenSize !== 'small' || activeView === 'cart') && (
          <div style={{
            width: screenSize === 'small' ? '100%' : '320px',
            minWidth: screenSize === 'small' ? '0' : '300px',
            maxWidth: screenSize === 'small' ? 'none' : '380px',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
          {/* Cart Header */}
          <div style={{
            padding: '10px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
              Cart ({cartCount})
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>
              ₹{cartTotal.toFixed(2)}
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 15px',
                color: '#9ca3af',
                fontSize: '12px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛒</div>
                <div>Cart is empty</div>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.id}-${index}`} style={{
                  background: '#f9fafb',
                  borderRadius: '6px',
                  padding: '8px',
                  marginBottom: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{
                        padding: '3px 6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            {/* Customer Type Selection */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              <button
                onClick={() => setShowCustomerLookup(true)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  background: selectedCustomer ? '#dbeafe' : '#f3f4f6',
                  color: selectedCustomer ? '#1e40af' : '#374151',
                  border: selectedCustomer ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>👤</span>
                <span>{selectedCustomer ? selectedCustomer.name : 'Customer'}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerPhone('');
                }}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  background: !selectedCustomer ? '#dbeafe' : '#f3f4f6',
                  color: !selectedCustomer ? '#1e40af' : '#374151',
                  border: !selectedCustomer ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>🚶</span>
                <span>Walk-in</span>
              </button>
            </div>

            {/* Table Assignment */}
            <div style={{ marginBottom: '6px' }}>
              <button
                onClick={() => setShowTableSelector(true)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: selectedTable ? '#dbeafe' : '#f3f4f6',
                  color: selectedTable ? '#1e40af' : '#374151',
                  border: selectedTable ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>🪑 {selectedTable ? `Table ${selectedTable.name}` : 'Select Table'}</span>
                {selectedTable && <span>✓</span>}
              </button>
            </div>

            {/* Order Summary */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#059669', marginBottom: '2px' }}>
                  <span>Discount ({discount}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {gstRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                  <span>GST ({gstRate}%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#1f2937', paddingTop: '3px', borderTop: '1px solid #e5e7eb' }}>
                <span>Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '8px',
                background: cart.length > 0 ? '#2563eb' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      )}

        {/* Right Column - Numpad & Actions */}
        {(screenSize !== 'small' || activeView === 'keypad') && (
          <div style={{
            width: screenSize === 'small' ? '100%' : '260px',
            minWidth: screenSize === 'small' ? '0' : '240px',
            maxWidth: screenSize === 'small' ? 'none' : '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            paddingRight: screenSize === 'small' ? '4px' : '0'
          }}>
          {/* Quick Actions */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
              Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {[
                { id: 'hold', label: 'Hold', icon: '⏸️' },
                { id: 'split', label: 'Split', icon: '💸' },
                { id: 'void', label: 'Void', icon: '❌' },
                { id: 'discount', label: 'Disc', icon: '🏷️' },
                { id: 'gst', label: 'GST', icon: '🧾' },
                { id: 'print', label: 'Print', icon: '🖨️' }
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'hold') handleHoldOrder();
                    if (action.id === 'void') handleVoidLastItem();
                    if (action.id === 'discount') setDiscount(discount === 0 ? 10 : 0);
                    if (action.id === 'gst') setShowGstSettings(true);
                    if (action.id === 'print') setShowPrintSettings(true);
                    if (action.id === 'split') setShowSplitBillModal(true);
                  }}
                  style={{
                    padding: '6px 4px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Numpad */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '8px',
            flex: 1
          }}>
            {/* Numpad Mode Toggle */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              {['quantity', 'discount', 'amount'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setNumpadMode(mode)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    background: numpadMode === mode ? '#2563eb' : '#f3f4f6',
                    color: numpadMode === mode ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Numpad Search */}
            <div style={{ marginBottom: '6px', position: 'relative' }}>
              <input
                type="text"
                value={numpadSearch}
                onChange={(e) => setNumpadSearch(e.target.value)}
                placeholder="🔍 Search..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '11px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              {numpadSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  marginTop: '3px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}>
                  {numpadSearchResults.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        addToCart(item, quantityInput);
                        setNumpadSearch('');
                      }}
                      style={{
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: '#1e293b'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <span>{item.name}</span>
                      <span style={{ fontSize: '9px', color: '#64748b', background: '#f1f5f9', padding: '2px 4px', borderRadius: '3px' }}>
                        {item.code || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {numpadMode === 'quantity' ? 'Quantity' : numpadMode === 'discount' ? 'Discount %' : 'Amount'}
            </div>
            <input
              type="text"
              value={numpadMode === 'discount' ? discount : quantityInput}
              onChange={(e) => {
                if (numpadMode === 'discount') {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) setDiscount(val);
                } else {
                  setQuantityInput(e.target.value);
                }
              }}
              placeholder={numpadMode === 'quantity' ? 'Enter quantity' : numpadMode === 'discount' ? 'Enter discount %' : 'Enter amount'}
              style={{
                width: '100%',
                padding: '8px',
                background: '#ffffff',
                color: '#0f172a',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '6px',
                fontFamily: 'monospace',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫'].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumpadClick(key)}
                  style={{
                    padding: '10px',
                    background: key === 'C' || key === '⌫' ? '#fee2e2' : '#f3f4f6',
                    color: key === 'C' || key === '⌫' ? '#dc2626' : '#1f2937',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = key === 'C' || key === '⌫' ? '#fecaca' : '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = key === 'C' || key === '⌫' ? '#fee2e2' : '#f3f4f6';
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Order */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '12px'
          }}>
            <button
              onClick={() => setShowCustomOrder(true)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Custom Order
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Customer Lookup Modal */}
      {showCustomerLookup && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Customer Lookup
              </h3>
              <button
                onClick={() => {
                  setShowCustomerLookup(false);
                  setCustomerPhone('');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#f9fafb',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            />
            {customerPhone && (
              <div style={{ marginBottom: '16px' }}>
                {lookupCustomer(customerPhone) ? (
                  <div style={{
                    background: '#dbeafe',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #93c5fd'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                      {lookupCustomer(customerPhone).name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#1e40af' }}>
                      {lookupCustomer(customerPhone).phone}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomer(lookupCustomer(customerPhone));
                        setShowCustomerLookup(false);
                        setCustomerPhone('');
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Select Customer
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: '#fee2e2',
                    padding: '12px',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '13px'
                  }}>
                    Customer not found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Select Table
              </h3>
              <button
                onClick={() => setShowTableSelector(false)}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {tables && tables.length > 0 ? tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setShowTableSelector(false);
                  }}
                  style={{
                    padding: '20px',
                    background: selectedTable?.id === table.id ? '#2563eb' : table.status === 'occupied' ? '#fee2e2' : '#f3f4f6',
                    color: selectedTable?.id === table.id ? '#ffffff' : table.status === 'occupied' ? '#dc2626' : '#374151',
                    border: selectedTable?.id === table.id ? '2px solid #2563eb' : table.status === 'occupied' ? '1px solid #fecaca' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🪑</span>
                  <span>{table.name}</span>
                  <span style={{ fontSize: '10px', textTransform: 'capitalize' }}>{table.status || 'available'}</span>
                  {table.currentToken && (
                    <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>
                      {table.currentToken}
                    </span>
                  )}
                </button>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  No tables available
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setShowTableSelector(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Table
              </button>
              <button
                onClick={() => setShowTableSelector(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Order Modal */}
      {showCustomOrder && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Custom Order
              </h3>
              <button
                onClick={() => {
                  setShowCustomOrder(false);
                  setCustomOrderName('');
                  setCustomOrderPrice('');
                  setCustomOrderQuantity('1');
                  setCustomOrderNotes('');
                  setCustomOrderCategory('');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Quick Presets
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Water Bottle', price: 20 },
                  { name: 'Extra Sauce', price: 10 },
                  { name: 'Takeaway Box', price: 15 },
                  { name: 'Tissues', price: 5 }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomOrderName(preset.name);
                      setCustomOrderPrice(preset.price.toString());
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.name} (₹{preset.price})
                  </button>
                ))}
              </div>
            </div>

            {/* Order Name */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Order Name *
              </label>
              <input
                type="text"
                value={customOrderName}
                onChange={(e) => setCustomOrderName(e.target.value)}
                placeholder="Enter item name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Price and Quantity Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={customOrderPrice}
                  onChange={(e) => setCustomOrderPrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                  Qty
                </label>
                <input
                  type="number"
                  value={customOrderQuantity}
                  onChange={(e) => setCustomOrderQuantity(e.target.value)}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Category
              </label>
              <select
                value={customOrderCategory}
                onChange={(e) => setCustomOrderCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select category...</option>
                <option value="Beverages">Beverages</option>
                <option value="Food">Food</option>
                <option value="Extras">Extras</option>
                <option value="Services">Services</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Notes (Optional)
              </label>
              <textarea
                value={customOrderNotes}
                onChange={(e) => setCustomOrderNotes(e.target.value)}
                placeholder="Add any special instructions..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Preview */}
            {customOrderName && customOrderPrice && (
              <div style={{
                background: '#dbeafe',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #93c5fd'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                  Preview
                </div>
                <div style={{ fontSize: '14px', color: '#1e40af' }}>
                  {customOrderName} × {customOrderQuantity} = ₹{(parseFloat(customOrderPrice) * parseInt(customOrderQuantity || 1)).toFixed(2)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCustomOrder(false);
                  setCustomOrderName('');
                  setCustomOrderPrice('');
                  setCustomOrderQuantity('1');
                  setCustomOrderNotes('');
                  setCustomOrderCategory('');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addCustomOrder}
                disabled={!customOrderName || !customOrderPrice}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: customOrderName && customOrderPrice ? '#2563eb' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: customOrderName && customOrderPrice ? 'pointer' : 'not-allowed'
                }}
              >
                Add to Cart
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Held Orders ({heldOrders.length})
              </h3>
              <button
                onClick={() => setShowHeldOrders(false)}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            {heldOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No held orders
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {heldOrders.map(heldOrder => (
                  <div
                    key={heldOrder.id}
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {heldOrder.cart.length} items
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(heldOrder.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb' }}>
                        ₹{heldOrder.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </div>
                    </div>
                    {heldOrder.customer && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Customer: {heldOrder.customer.name}
                      </div>
                    )}
                    {heldOrder.table && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Table: {heldOrder.table.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleResumeOrder(heldOrder)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleDeleteHeldOrder(heldOrder.id)}
                        style={{
                          padding: '10px 16px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GST Settings Modal */}
      {showGstSettings && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                GST Settings
              </h3>
              <button
                onClick={() => setShowGstSettings(false)}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                GST Rate (%)
              </label>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) setGstRate(val);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0, 5, 12, 18, 28].map(rate => (
                <button
                  key={rate}
                  onClick={() => setGstRate(rate)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: gstRate === rate ? '#2563eb' : '#f3f4f6',
                    color: gstRate === rate ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowGstSettings(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSettings({ ...settings, gstRate });
                  setShowGstSettings(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Settings Modal */}
      {showPrintSettings && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Print Settings
              </h3>
              <button
                onClick={() => setShowPrintSettings(false)}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Print Options */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Number of Copies
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => setPrintCopies(num)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: printCopies === num ? '#2563eb' : '#f3f4f6',
                      color: printCopies === num ? '#ffffff' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Print Documents
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setPrintKot(!printKot)}
                  style={{
                    padding: '12px',
                    background: printKot ? '#dbeafe' : '#f3f4f6',
                    color: printKot ? '#1e40af' : '#374151',
                    border: printKot ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Kitchen Order Ticket (KOT)</span>
                  <span>{printKot ? '✓' : '✗'}</span>
                </button>
                <button
                  onClick={() => setPrintReceiptEnabled(!printReceiptEnabled)}
                  style={{
                    padding: '12px',
                    background: printReceiptEnabled ? '#dbeafe' : '#f3f4f6',
                    color: printReceiptEnabled ? '#1e40af' : '#374151',
                    border: printReceiptEnabled ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Customer Receipt</span>
                  <span>{printReceiptEnabled ? '✓' : '✗'}</span>
                </button>
              </div>
            </div>

            {/* Print Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowPrintSettings(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              {lastOrder && (
                <button
                  onClick={() => {
                    if (printReceiptEnabled) {
                      for (let i = 0; i < printCopies; i++) {
                        printReceipt();
                      }
                    }
                    if (printKot) {
                      // Print KOT logic
                      kotManager.createKOT(lastOrder);
                      kotPrinter.printKOT(lastOrder);
                    }
                    setShowPrintSettings(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Print
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Payment
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Summary */}
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Discount ({discount}%)</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {gstRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>GST ({gstRate}%)</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Total</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px', display: 'block' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'CASH', label: '💵 Cash', icon: '💵' },
                  { id: 'CARD', label: '💳 Card', icon: '💳' },
                  { id: 'UPI', label: '📱 UPI', icon: '📱' },
                  { id: 'WALLET', label: '👛 Wallet', icon: '👛' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: '16px',
                      background: paymentMethod === method.id ? '#2563eb' : '#f3f4f6',
                      color: paymentMethod === method.id ? '#ffffff' : '#374151',
                      border: paymentMethod === method.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {method.icon} {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Amount Input for Card/UPI/Wallet */}
            {paymentMethod !== 'CASH' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                  Enter Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`₹${cartTotal.toFixed(2)}`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                />
              </div>
            )}

            {/* Customer Info */}
            {selectedCustomer && (
              <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  {selectedCustomer.phone}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={paymentMethod !== 'CASH' && (!paymentAmount || parseFloat(paymentAmount) < cartTotal)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: (paymentMethod === 'CASH' || (paymentAmount && parseFloat(paymentAmount) >= cartTotal)) ? '#2563eb' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (paymentMethod === 'CASH' || (paymentAmount && parseFloat(paymentAmount) >= cartTotal)) ? 'pointer' : 'not-allowed'
                }}
              >
                Complete Payment
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
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Split Bill
              </h3>
              <button
                onClick={() => {
                  setShowSplitBillModal(false);
                  setSplitPayments([]);
                  setSplitMode('equal');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Summary */}
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                <span>Total Amount</span>
                <span style={{ color: '#2563eb' }}>₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Split Mode Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px', display: 'block' }}>
                Split Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'equal', label: 'Equal Split' },
                  { id: 'custom', label: 'Custom Amounts' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setSplitMode(mode.id);
                      setSplitPayments([]);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: splitMode === mode.id ? '#2563eb' : '#f3f4f6',
                      color: splitMode === mode.id ? '#ffffff' : '#374151',
                      border: splitMode === mode.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equal Split Options */}
            {splitMode === 'equal' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px', display: 'block' }}>
                  Number of People
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => splitEqually(num)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
 )}

            {/* Custom Split */}
            {splitMode === 'custom' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f9fafb',
                      color: '#1f2937',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={addSplitPayment}
                    style={{
                      padding: '12px 20px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Payment Methods for Custom Split */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { id: 'CASH', label: '💵 Cash' },
                    { id: 'CARD', label: '💳 Card' },
                    { id: 'UPI', label: '📱 UPI' },
                    { id: 'WALLET', label: '👛 Wallet' }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: '10px',
                        background: paymentMethod === method.id ? '#2563eb' : '#f3f4f6',
                        color: paymentMethod === method.id ? '#ffffff' : '#374151',
                        border: paymentMethod === method.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Split Payments List */}
            {splitPayments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                  Split Payments ({splitPayments.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {splitPayments.map((payment, index) => (
                    <div
                      key={payment.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                          Person {index + 1} - {payment.method}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {new Date(payment.time).toLocaleTimeString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                          ₹{payment.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeSplitPayment(payment.id)}
                          style={{
                            padding: '6px 10px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '12px', padding: '12px', background: '#dbeafe', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#1e40af' }}>Total Paid</span>
                    <span style={{ fontWeight: '600', color: '#1e40af' }}>
                      ₹{splitPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '4px' }}>
                    <span style={{ color: '#1e40af' }}>Remaining</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>
                      ₹{(cartTotal - splitPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSplitBillModal(false);
                  setSplitPayments([]);
                  setSplitMode('equal');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processSplitPayment}
                disabled={Math.abs(splitPayments.reduce((sum, p) => sum + p.amount, 0) - cartTotal) > 0.01}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: Math.abs(splitPayments.reduce((sum, p) => sum + p.amount, 0) - cartTotal) <= 0.01 ? '#2563eb' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: Math.abs(splitPayments.reduce((sum, p) => sum + p.amount, 0) - cartTotal) <= 0.01 ? 'pointer' : 'not-allowed'
                }}
              >
                Complete Split Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modifiers Modal */}
      {showModifiersModal && selectedItemForModifiers && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '90%',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1a1a2e',
              color: '#f5f5f5',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'Georgia, serif'
            }}>
              <span>Add Modifiers</span>
              <button
                onClick={() => setShowModifiersModal(false)}
                style={{
                  background: 'rgba(201, 162, 39, 0.2)',
                  border: '1px solid #c9a227',
                  color: '#c9a227',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontFamily: 'Georgia, serif'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', background: '#ffffff' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '12px', fontFamily: 'Georgia, serif' }}>
                  {selectedItemForModifiers.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {commonModifiers.map(modifier => (
                    <button
                      key={modifier.id}
                      onClick={() => toggleModifier(modifier)}
                      style={{
                        padding: '10px',
                        background: selectedModifiers.find(m => m.id === modifier.id) ? '#1a1a2e' : '#f5f0e6',
                        color: selectedModifiers.find(m => m.id === modifier.id) ? '#f5f5f5' : '#1a1a2e',
                        border: selectedModifiers.find(m => m.id === modifier.id) ? '2px solid #c9a227' : '1px solid #d4c4a8',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'Georgia, serif'
                      }}
                    >
                      {modifier.name} {modifier.price > 0 && `(₹${modifier.price})`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowModifiersModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f5f0e6',
                    color: '#2c2c2c',
                    border: '1px solid #d4c4a8',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addToCart(selectedItemForModifiers, quantityInput);
                    setShowModifiersModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#f5f5f5',
                    border: '2px solid #c9a227',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            border: '2px solid #c9a227'
          }}>
            <div style={{
              background: '#1a1a2e',
              color: '#f5f5f5',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'Georgia, serif'
            }}>
              <span>Order History</span>
              <button
                onClick={() => setShowOrderHistory(false)}
                style={{
                  background: 'rgba(201, 162, 39, 0.2)',
                  border: '1px solid #c9a227',
                  color: '#c9a227',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontFamily: 'Georgia, serif'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontFamily: 'Georgia, serif' }}>
                  No orders yet
                </div>
              ) : (
                orders.slice().reverse().slice(0, 20).map(order => (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderForView(order);
                      setShowOrderHistory(false);
                    }}
                    style={{
                      background: '#f5f0e6',
                      border: '1px solid #d4c4a8',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>Order #{order.id.split('-')[1]}</span>
                      <span style={{ fontSize: '13px', color: '#8b7355' }}>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8b7355' }}>
                      Total: <span style={{ fontWeight: '500', color: '#1a1a2e', fontFamily: '"Courier New", monospace' }}>₹{order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderForView && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            border: '2px solid #c9a227'
          }}>
            <div style={{
              background: '#1a1a2e',
              color: '#f5f5f5',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'Georgia, serif'
            }}>
              <span>Order #{selectedOrderForView.id.split('-')[1]}</span>
              <button
                onClick={() => setSelectedOrderForView(null)}
                style={{
                  background: 'rgba(201, 162, 39, 0.2)',
                  border: '1px solid #c9a227',
                  color: '#c9a227',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontFamily: 'Georgia, serif'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#8b7355', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>Date</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{new Date(selectedOrderForView.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#8b7355', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>Items</div>
                {selectedOrderForView.items?.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f0e6' }}>
                    <span style={{ fontSize: '14px', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{item.name} × {item.qty}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', fontFamily: '"Courier New", monospace' }}>₹{((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #c9a227' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: '"Courier New", monospace' }}>₹{selectedOrderForView.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
