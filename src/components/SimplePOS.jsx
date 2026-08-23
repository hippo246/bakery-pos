import React, { useState, useMemo, useEffect } from 'react';
import Razorpay from 'razorpay';
import { useTerminal } from '../terminal/TerminalContext.jsx';
import { getKOTManager } from '../operations/KOTManager.js';
import { getKOTPrinter } from '../utils/KOTPrinter.js';
import { createReceiptLayout } from '../print/receiptLayout.js';
import { getAggregatorService } from '../services/aggregators/AggregatorService.js';
import VoiceOrderRecorder from './voice/VoiceOrderRecorder';
import SpeakButton from './voice/SpeakButton';
import textToSpeechService from '../services/voice/TextToSpeechService';

export default function SimplePOS({ orders = [], setOrders, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, settings = {}, setSettings, staff = [], tables = [], setTables }) {
  const { currentTerminal } = useTerminal();
  const posMode = settings.posMode || 'basic';
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantityInput, setQuantityInput] = useState('0');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(settings.gstRate || 18);
  const [gstEnabled, setGstEnabled] = useState(settings.gstEnabled !== false); // Default to true unless explicitly disabled
  
  // Initialize KOT manager
  const kotManager = getKOTManager();
  const kotPrinter = getKOTPrinter();
  
  useEffect(() => {
    try {
      kotManager.initialize();
    } catch (error) {
      console.error('Error initializing KOT manager:', error);
    }
  }, [kotManager]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [splitPayments, setSplitPayments] = useState([]); // Array of {method, amount}
  const [splitByPeople, setSplitByPeople] = useState(0); // Number of people to split by
  const [receiptDelivery, setReceiptDelivery] = useState('none'); // none, email, sms, both
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  
  // Filter staff based on terminal assignment
  const availableStaff = useMemo(() => {
    if (!staff || !Array.isArray(staff)) return [];
    if (!currentTerminal || !currentTerminal.assignedStaff || currentTerminal.assignedStaff.length === 0) {
      return staff; // If no terminal or no assignment, show all staff
    }
    return staff.filter(s => currentTerminal.assignedStaff.includes(s.id));
  }, [staff, currentTerminal]);

  const [selectedEmployee, setSelectedEmployee] = useState(() => {
    if (!staff || !Array.isArray(staff) || staff.length === 0) return null;
    if (!currentTerminal || !currentTerminal.assignedStaff || currentTerminal.assignedStaff.length === 0) {
      return staff[0];
    }
    const filtered = staff.filter(s => currentTerminal.assignedStaff.includes(s.id));
    return filtered.length > 0 ? filtered[0] : null;
  });
  const [heldOrders, setHeldOrders] = useState([]);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
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
  const [selectedBaseItem, setSelectedBaseItem] = useState(null);
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
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  
  // Cart restore state
  const [showCartRestore, setShowCartRestore] = useState(false);
  const [cartRestoreReason, setCartRestoreReason] = useState('');
  const [restoredCart, setRestoredCart] = useState(null);
  
  // Voice ordering state
  const [showVoiceOrder, setShowVoiceOrder] = useState(false);
  
  // Cart item selection state
  const [selectedCartItems, setSelectedCartItems] = useState([]);
  const [showItemActions, setShowItemActions] = useState(false);
  const [itemActionMode, setItemActionMode] = useState('quantity'); // 'quantity', 'discount', 'amount', 'notes'
  const [noteType, setNoteType] = useState('regular'); // 'regular' or 'allergy'
  const [isEditingCartItems, setIsEditingCartItems] = useState(false);
  
  // Aggregator integration
  const aggregatorService = useMemo(() => getAggregatorService(), []);
  const [aggregatorOrders, setAggregatorOrders] = useState([]);
  const [showAggregatorDropdown, setShowAggregatorDropdown] = useState(false);
  const [showAggregatorPanel, setShowAggregatorPanel] = useState(false);
  const [aggregatorInitialized, setAggregatorInitialized] = useState(false);

  // Initialize aggregator service
  useEffect(() => {
    const initAggregatorService = async () => {
      try {
        const config = {
          zomato: {
            enabled: settings.zomatoApiKey && settings.zomatoRestaurantId,
            apiKey: settings.zomatoApiKey || '',
            restaurantId: settings.zomatoRestaurantId || '',
            environment: settings.aggregatorEnvironment || 'production'
          },
          swiggy: {
            enabled: settings.swiggyApiKey && settings.swiggyRestaurantId,
            apiKey: settings.swiggyApiKey || '',
            restaurantId: settings.swiggyRestaurantId || '',
            environment: settings.aggregatorEnvironment || 'production'
          },
          polling: {
            enabled: true,
            interval: 30000
          }
        };

        await aggregatorService.initialize(config);
        setAggregatorInitialized(true);

        // Load initial orders
        const orders = aggregatorService.getOrders();
        setAggregatorOrders(orders);

        // Add event listener for real-time updates
        const removeListener = aggregatorService.addListener((event, data) => {
          if (event === 'order_added' || event === 'order_updated') {
            setAggregatorOrders(aggregatorService.getOrders());
          }
        });

        return () => removeListener();
      } catch (error) {
        console.error('Failed to initialize aggregator service:', error);
        // Use mock data if initialization fails
        setAggregatorOrders([
          { id: 'ZOM-001', platform: 'Zomato', orderId: 'ZOM123456', customer: 'Rahul Sharma', items: 'Butter Chicken x2, Naan x4', total: 850, status: 'pending', time: '14:30', commission: 85 },
          { id: 'ZOM-002', platform: 'Zomato', orderId: 'ZOM123457', customer: 'Priya Singh', items: 'Paneer Tikka x1, Rice x2', total: 650, status: 'pending', time: '14:45', commission: 65 },
          { id: 'SWG-001', platform: 'Swiggy', orderId: 'SWG789012', customer: 'Amit Patel', items: 'Biryani x2', total: 720, status: 'pending', time: '15:00', commission: 72 }
        ]);
      }
    };

    initAggregatorService();
  }, [settings, aggregatorService]);

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

  // Combine regular orders with QR orders for order history
  const allOrders = useMemo(() => {
    const combinedOrders = [...(orders || [])];
    
    try {
      const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      qrOrders.forEach(qrOrder => {
        if (!combinedOrders.find(o => o.id === qrOrder.id)) {
          combinedOrders.push({
            ...qrOrder,
            isQROrder: true
          });
        }
      });
    } catch (error) {
      console.error('Error reading QR orders:', error);
    }
    
    return combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  // Common modifiers - could be made configurable in settings in the future
  const commonModifiers = settings.commonModifiers || [
    { id: 'extra', name: 'Extra', price: 10 },
    { id: 'no', name: 'No', price: 0 },
    { id: 'spicy', name: 'Spicy', price: 5 },
    { id: 'mild', name: 'Mild', price: 0 },
    { id: 'hot', name: 'Hot', price: 5 },
    { id: 'cold', name: 'Cold', price: 0 }
  ];

  // Categories - could be made configurable in settings in the future
  const categories = settings.categories || ['All', 'Breads', 'Pastries', 'Cakes', 'Coffee', 'Beverages'];

  // Top 10 items for quick add shortcuts (0-9)
  const topItems = useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return [];
    return menuItems
      .filter(item => item && item.active && !item.eightySixed)
      .slice(0, 10);
  }, [menuItems]);

  // Fuzzy search for menu items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    if (!menuItems || !Array.isArray(menuItems)) return [];
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => {
      if (!item || !item.active || item.eightySixed) return false;
      const nameMatch = item.name && item.name.toLowerCase().includes(query);
      const codeMatch = item.code && item.code.toLowerCase().includes(query);
      const categoryMatch = item.category && item.category.toLowerCase().includes(query);
      return nameMatch || codeMatch || categoryMatch;
    }).slice(0, 10);
  }, [searchQuery, menuItems]);

  // Numpad search results
  const numpadSearchResults = useMemo(() => {
    if (!numpadSearch.trim()) return [];
    if (!menuItems || !Array.isArray(menuItems)) return [];
    const query = numpadSearch.toLowerCase();
    return menuItems.filter(item => {
      if (!item || !item.active || item.eightySixed) return false;
      const nameMatch = item.name && item.name.toLowerCase().includes(query);
      const codeMatch = item.code && item.code.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    }).slice(0, 5);
  }, [numpadSearch, menuItems]);

  // Customer lookup by phone
  const lookupCustomer = (phone) => {
    if (!phone || !phone.trim()) return null;
    if (!customers || !Array.isArray(customers)) return null;
    return customers.find(c => c && c.phone === phone) || null;
  };

  // Smart category suggestion based on time of day (disabled - default to All)
  const getSmartCategory = () => {
    return 'All';
  };

  // Auto-select smart category on mount (disabled - always default to All)
  useEffect(() => {
    // Disabled - always default to 'All' category
    setSelectedCategory('All');
  }, []);

  // Auto-save cart to localStorage for recovery
  useEffect(() => {
    if (posMode === 'advanced' && cart.length > 0) {
      try {
        localStorage.setItem('pos_cart_backup', JSON.stringify(cart));
        localStorage.setItem('pos_cart_backup_timestamp', Date.now().toString());
        localStorage.setItem('pos_cart_backup_reason', 'Active session');
      } catch (error) {
        console.error('Failed to save cart backup:', error);
      }
    }
  }, [cart, posMode]);

  // Restore cart on mount if available
  useEffect(() => {
    if (posMode === 'advanced') {
      try {
        const savedCart = localStorage.getItem('pos_cart_backup');
        const savedTimestamp = localStorage.getItem('pos_cart_backup_timestamp');
        const savedReason = localStorage.getItem('pos_cart_backup_reason');
        
        if (savedCart && cart.length === 0) {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart && parsedCart.length > 0) {
            // Determine restore reason
            let reason = savedReason || 'Previous session';
            if (savedTimestamp) {
              const timeDiff = Date.now() - parseInt(savedTimestamp);
              const minutesAgo = Math.floor(timeDiff / 60000);
              if (minutesAgo < 1) {
                reason = 'Page refreshed';
              } else if (minutesAgo < 60) {
                reason = `Session interrupted (${minutesAgo}m ago)`;
              } else {
                reason = 'Previous session';
              }
            }
            
            setCartRestoreReason(reason);
            setRestoredCart(parsedCart);
            setShowCartRestore(true);
          }
        }
      } catch (error) {
        console.error('Failed to restore cart:', error);
      }
    }
  }, [posMode, cart.length]);

  // Popular items for quick add
  const popularItems = useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return [];
    return menuItems
      .filter(item => item && item.active && !item.eightySixed)
      .slice(0, 6)
      .map(item => ({ ...item, popular: true }));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return [];
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter(item => item && item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const addToCart = (item, quantity) => {
    if (!item) {
      console.error('addToCart called with undefined item');
      return;
    }
    const qty = parseInt(quantity) || 1;
    setCart(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      const existing = prev.find(i => i && i.id === item.id && JSON.stringify(i.modifiers) === JSON.stringify(selectedModifiers));
      if (existing) {
        return prev.map(i =>
          i && i.id === item.id && JSON.stringify(i.modifiers) === JSON.stringify(selectedModifiers)
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      const modifierPrice = (selectedModifiers || []).reduce((sum, m) => sum + (m.price || 0), 0);
      const variantPrice = selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0;
      return [...prev, {
        ...item,
        quantity: qty,
        modifiers: selectedModifiers || [],
        variant: selectedVariant,
        price: (item.price || 0) + modifierPrice + variantPrice
      }];
    });
    setQuantityInput('0');
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
    if (!customOrderName || !customOrderPrice) {
      setAlertMessage('Please fill in required fields');
      setShowAlert(true);
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
      isCustom: true,
      baseItemId: selectedBaseItem?.id || null,
      baseItemName: selectedBaseItem?.name || null
    };
    
    setCart(prev => [...prev, customItem]);
    setShowCustomOrder(false);
    setCustomOrderName('');
    setCustomOrderPrice('');
    setCustomOrderQuantity('1');
    setCustomOrderNotes('');
    setCustomOrderCategory('');
    setSelectedBaseItem(null);
  };

  // Handle voice order parsed result
  const handleVoiceOrderParsed = (parsedOrder) => {
    console.log('handleVoiceOrderParsed called with:', parsedOrder);
    
    if (parsedOrder.forEditing) {
      console.log('Processing forEditing flag');
      // Add items to cart for editing using existing cart functionality
      if (parsedOrder.items && parsedOrder.items.length > 0) {
        console.log('Adding items to cart:', parsedOrder.items);
        parsedOrder.items.forEach(item => {
          const menuItem = menuItems.find(m => m.id === item.menuItemId || m.name.toLowerCase() === item.name.toLowerCase());
          if (menuItem) {
            addToCart({
              id: menuItem.id,
              name: item.name,
              price: menuItem.price,
              quantity: item.quantity,
              category: menuItem.category
            }, item.quantity);
          } else {
            console.log('Menu item not found for:', item);
          }
        });

        // Set table if detected
        if (parsedOrder.tableNumber) {
          const table = tables.find(t => t.id === parsedOrder.tableNumber || t.name === `T${parsedOrder.tableNumber}`);
          if (table) {
            setSelectedTable(table);
          }
        }

        // Add notes if any
        if (parsedOrder.notes) {
          setCart(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].notes = parsedOrder.notes;
            }
            return updated;
          });
        }
      }
      console.log('Closing voice order modal');
      setShowVoiceOrder(false);
      return;
    }
    
    if (parsedOrder.needsEdit) {
      // Show edit modal for the parsed order
      setAlertMessage('Please review and edit the order');
      setShowAlert(true);
      return;
    }
    
    if (parsedOrder.items && parsedOrder.items.length > 0) {
      parsedOrder.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId || m.name.toLowerCase() === item.name.toLowerCase());
        if (menuItem) {
          addToCart({
            id: menuItem.id,
            name: item.name,
            price: menuItem.price,
            quantity: item.quantity,
            category: menuItem.category
          }, item.quantity);
        }
      });

      // Set table if detected
      if (parsedOrder.tableNumber) {
        const table = tables.find(t => t.id === parsedOrder.tableNumber || t.name === `T${parsedOrder.tableNumber}`);
        if (table) {
          setSelectedTable(table);
        }
      }

      // Add notes if any
      if (parsedOrder.notes) {
        setCart(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].notes = parsedOrder.notes;
          }
          return updated;
        });
      }

      setShowVoiceOrder(false);
    }
  };

  const handleRestoreCart = () => {
    if (restoredCart) {
      setCart(restoredCart);
      setShowCartRestore(false);
      setRestoredCart(null);
      setCartRestoreReason('');
      localStorage.removeItem('pos_cart_backup');
      localStorage.removeItem('pos_cart_backup_timestamp');
      localStorage.removeItem('pos_cart_backup_reason');
    }
  };

  const handleDismissRestore = () => {
    setShowCartRestore(false);
    setRestoredCart(null);
    setCartRestoreReason('');
    localStorage.removeItem('pos_cart_backup');
    localStorage.removeItem('pos_cart_backup_timestamp');
    localStorage.removeItem('pos_cart_backup_reason');
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
    setCart(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.filter((_, i) => i !== index);
    });
    setSelectedCartItems(prev => prev.filter(i => i !== index));
  };

  const toggleCartItemSelection = (index) => {
    setSelectedCartItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const clearCartSelection = () => {
    setSelectedCartItems([]);
  };

  const applyItemAction = () => {
    if (selectedCartItems.length === 0) return;

    const value = itemActionMode === 'quantity' ? parseInt(quantityInput) : 
                  itemActionMode === 'discount' ? discount :
                  itemActionMode === 'amount' ? parseFloat(quantityInput) : null;

    if (value === null && itemActionMode !== 'notes') return;

    setCart(prev => {
      return prev.map((item, index) => {
        if (!selectedCartItems.includes(index)) return item;

        switch (itemActionMode) {
          case 'quantity':
            return { ...item, quantity: value || 1 };
          case 'discount':
            return { ...item, discount: value || 0 };
          case 'amount':
            return { ...item, price: value || item.price };
          default:
            return item;
        }
      });
    });

    setIsEditingCartItems(false);
    clearCartSelection();
    setNumpadMode('quantity');
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.map(item => {
        if (!item) return item;
        if (item.id === itemId) {
          const newQuantity = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    if (!item) return sum;
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
  const cartCount = cart.reduce((sum, item) => {
    if (!item) return sum;
    return sum + (item.quantity || 0);
  }, 0);
  const discountAmount = (cartSubtotal * discount) / 100;
  const taxAmount = gstEnabled ? ((cartSubtotal - discountAmount) * gstRate) / 100 : 0;
  const cartTotal = cartSubtotal - discountAmount + taxAmount;

  const handleCheckout = () => {
    if (!cart || cart.length === 0) return;

    // Validate workflow requirements
    const validationError = validateWorkflow();
    if (validationError) {
      setAlertMessage(validationError);
      setShowAlert(true);
      return;
    }

    setShowPaymentModal(true);
  };

  const validateWorkflow = () => {
    const workflowSteps = settings.workflowSteps || ['items', 'customer', 'table', 'payment'];

    // Check if items are in cart (always required)
    if (!cart || cart.length === 0) {
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
        if (!tables || !Array.isArray(tables)) {
          return 'No tables available for auto-assignment.';
        }
        const availableTable = tables.find(t => t && t.status === 'available');
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
    if (!heldOrders || heldOrders.length >= (settings.maxHoldOrders || 10)) {
      return `Maximum hold orders (${settings.maxHoldOrders || 10}) reached. Please complete or clear held orders.`;
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
    if (!cart || cart.length === 0) return;

    // Validate split payments if selected
    if (paymentMethod === 'SPLIT') {
      const splitTotal = splitPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (Math.abs(splitTotal - cartTotal) > 0.01) {
        setAlertMessage(`Split payment total (₹${splitTotal.toFixed(2)}) must equal order total (₹${cartTotal.toFixed(2)})`);
        setShowAlert(true);
        return;
      }
    }

    // If payment method is CARD, UPI, or WALLET, use Razorpay
    if (['CARD', 'UPI', 'WALLET'].includes(paymentMethod) && paymentMethod !== 'SPLIT') {
      // Use environment variable or settings, fallback to test key
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || settings.razorpayKeyId;

      if (!razorpayKey) {
        setAlertMessage('Payment gateway not configured. Please contact administrator.');
        setShowAlert(true);
        console.error('Razorpay key not configured');
        return;
      }

      try {
        const options = {
          key: razorpayKey,
          amount: Math.round(Math.abs(paymentAmount || cartTotal || 0) * 100), // Amount in paise, ensure it's an integer
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
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed');
            },
            escape: true,
            confirm_close: true
          },
          notes: {
            order_id: `ORD-${Date.now().toString().slice(-6)}`,
            customer: selectedCustomer?.name || 'Walk-in'
          }
        };

        if (typeof window !== 'undefined' && window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.open();

          rzp.on('payment.failed', function(response) {
            console.error('Payment failed:', response.error);
            setAlertMessage('Payment failed: ' + (response.error?.description || 'Unknown error'));
            setShowAlert(true);
          });
        } else {
          throw new Error('Razorpay SDK not loaded');
        }
      } catch (error) {
        console.error('Razorpay error:', error);
        setAlertMessage('Payment initialization failed: ' + (error.message || 'Unknown error'));
        setShowAlert(true);
      }
    } else {
      // Cash payment or split payment - complete directly
      completeOrder(null);
    }
  };

  const sendEmailReceipt = async (order, email) => {
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      return false;
    }

    try {
      // Generate receipt HTML
      const receiptHTML = generateReceiptHTML(order);
      
      const apiKey = settings.brevoApiKey || 'xsmtpsib-409d85d7333f90f17511052fe49099bc8f8eb7d3afeaf29dac797f38d2cf3a6a-lnXkG4GFIZoEq99l';
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          sender: {
            name: settings.storeName || 'BakeryPOS',
            email: settings.storeEmail || 'noreply@bakerypos.com'
          },
          to: [{
            email: email,
            name: order.customerName || 'Customer'
          }],
          subject: `Receipt for Order #${order.id}`,
          htmlContent: receiptHTML,
          textContent: generateReceiptText(order)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Email sent successfully via Brevo:', data);
        setAlertMessage(`Receipt sent to ${email}`);
        setShowAlert(true);
        return true;
      } else {
        console.error('Brevo API error:', data);
        setAlertMessage(`Failed to send email: ${data.message || 'Unknown error'}`);
        setShowAlert(true);
        return false;
      }
    } catch (error) {
      console.error('Failed to send email receipt:', error);
      setAlertMessage('Failed to send email receipt');
      setShowAlert(true);
      return false;
    }
  };

  const sendSMSReceipt = async (order, phone) => {
    if (!phone || phone.length < 10) {
      console.error('Invalid phone number');
      return false;
    }

    try {
      // Generate receipt text
      const receiptText = generateReceiptText(order);
      
      // In a real implementation, you would send this to your SMS service
      // For now, we'll log it and show a success message
      console.log('SMS receipt would be sent to:', phone);
      console.log('Receipt content:', receiptText);
      
      // Placeholder for actual SMS sending
      // await fetch('/api/send-receipt-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, receipt: receiptText, orderId: order.id })
      // });
      
      setAlertMessage(`Receipt sent to ${phone}`);
      setShowAlert(true);
      return true;
    } catch (error) {
      console.error('Failed to send SMS receipt:', error);
      setAlertMessage('Failed to send SMS receipt');
      setShowAlert(true);
      return false;
    }
  };

  const generateReceiptHTML = (order) => {
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmt = order.discountAmount || (subtotal * (order.discount || 0)) / 100;
    const taxAmt = order.taxAmount || ((subtotal - discountAmt) * (order.gstRate || 0)) / 100;
    
    return `
      <div style="font-family: 'Courier New', monospace; max-width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px;">
          ${settings.storeLogo ? `<img src="${settings.storeLogo}" alt="Store Logo" style="width: 60px; height: 60px; margin: 0 auto 8px; display: block; object-fit: contain;" />` : ''}
          <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${settings.storeName || 'BakeryPOS'}</h2>
          ${settings.address ? `<div style="font-size: 10px;">${settings.address}</div>` : ''}
          ${settings.phone ? `<div style="font-size: 10px;">Tel: ${settings.phone}</div>` : ''}
          <div style="font-size: 10px;">GSTIN: ${settings.gstin || 'N/A'}</div>
          <div style="font-size: 10px;">FSSAI: ${settings.fssaiLicense || 'N/A'}</div>
          <div style="font-size: 10px;">Tariff: ${settings.tariffCode || 'N/A'}</div>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 10px 0; padding-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Order #${order.id}</span>
            <span>Token: ${order.token || 'N/A'}</span>
          </div>
          <div style="font-size: 10px;">${new Date(order.createdAt).toLocaleString()}</div>
          ${order.table ? `<div style="font-size: 10px;">Table: ${order.table}</div>` : ''}
          <div style="font-size: 10px;">Customer: ${order.customerName || 'Walk-in'}</div>
          <div style="font-size: 10px;">Staff: ${order.staffName || 'N/A'}</div>
        </div>
        ${order.items.map(item => `
          <div style="margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-weight: 500;">${item.name}</span>
              <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div style="font-size: 10px; color: #666;">${item.quantity} x ₹${item.price.toFixed(2)}</div>
            ${item.isCustom ? `
              <div style="font-size: 10px; color: #92400e; margin-top: 2px;">
                ⚙️ Custom
                ${item.baseItemName ? ` (Base: ${item.baseItemName})` : ''}
              </div>
            ` : ''}
            ${item.notes ? `
              <div style="font-size: 10px; color: ${item.noteType === 'allergy' ? '#dc2626' : '#666'}; margin-top: 2px; ${item.noteType === 'allergy' ? 'font-weight: bold;' : ''}">
                ${item.noteType === 'allergy' ? '⚠️ ' : '📝 '}${item.notes}
              </div>
            ` : ''}
          </div>
        `).join('')}
        <div style="border-top: 2px solid #000; margin: 10px 0; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${(order.discount || 0) > 0 && `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Discount (${order.discount}%):</span>
              <span>-₹${discountAmt.toFixed(2)}</span>
            </div>
          `}
          ${order.gstEnabled !== false && (order.gstRate || 0) > 0 && `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>GST (${order.gstRate}%):</span>
              <span>₹${taxAmt.toFixed(2)}</span>
            </div>
          `}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; border-top: 1px solid #000; padding-top: 8px;">
            <span>TOTAL:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
          <div style="font-size: 10px; margin-top: 4px;">
            Paid: ${order.splitPayments && order.splitPayments.length > 0 ? 'Split' : order.paymentMethod}
          </div>
        </div>
        <div style="text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px;">
          <div style="font-size: 11px; margin-bottom: 8px;">${settings.receiptFooter || 'Thank you for your order!'}</div>
          ${settings.googleReviewUrl ? `
            <div style="margin-top: 12px;">
              <div style="font-size: 10px; margin-bottom: 6px;">Scan to review us:</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(settings.googleReviewUrl.trim())}" alt="Google Review QR" style="width: 80px; height: 80px; margin: 0 auto; display: block; border: 1px solid #000;" />
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  const generateReceiptText = (order) => {
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmt = order.discountAmount || (subtotal * (order.discount || 0)) / 100;
    const taxAmt = order.taxAmount || ((subtotal - discountAmt) * (order.gstRate || 0)) / 100;
    
    let text = `${settings.storeName || 'BakeryPOS'}\n`;
    if (settings.address) text += `${settings.address}\n`;
    if (settings.phone) text += `Tel: ${settings.phone}\n`;
    text += `GSTIN: ${settings.gstin || 'N/A'}\n`;
    text += `FSSAI: ${settings.fssaiLicense || 'N/A'}\n`;
    text += `Tariff: ${settings.tariffCode || 'N/A'}\n`;
    text += '================================\n';
    text += `Order #${order.id}\n`;
    text += `Token: ${order.token || 'N/A'}\n`;
    text += `${new Date(order.createdAt).toLocaleString()}\n`;
    if (order.table) text += `Table: ${order.table}\n`;
    text += `Customer: ${order.customerName || 'Walk-in'}\n`;
    text += `Staff: ${order.staffName || 'N/A'}\n`;
    text += '--------------------------------\n';
    
    order.items.forEach(item => {
      text += `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}\n`;
      text += `  ${item.quantity} x ₹${item.price.toFixed(2)}\n`;
      if (item.isCustom) {
        text += `  ⚙️ Custom`;
        if (item.baseItemName) {
          text += ` (Base: ${item.baseItemName})`;
        }
        text += '\n';
      }
      if (item.notes) {
        text += `  ${item.noteType === 'allergy' ? '⚠️ ' : '📝 '}${item.notes}\n`;
      }
      text += '--------------------------------\n';
    });
    
    text += 'Subtotal: ₹' + subtotal.toFixed(2) + '\n';
    
    if ((order.discount || 0) > 0) {
      text += `Discount (${order.discount}%): -₹${discountAmt.toFixed(2)}\n`;
    }
    
    if (order.gstEnabled !== false && (order.gstRate || 0) > 0) {
      text += `GST (${order.gstRate}%): ₹${taxAmt.toFixed(2)}\n`;
    }
    
    text += '================================\n';
    text += `TOTAL: ₹${order.total.toFixed(2)}\n`;
    text += `Paid: ${order.splitPayments && order.splitPayments.length > 0 ? 'Split' : order.paymentMethod}\n`;
    text += '================================\n';
    text += `\n${settings.receiptFooter || 'Thank you for your order!'}`;
    
    if (settings.googleReviewUrl) {
      text += `\n\nScan to review us:\n${settings.googleReviewUrl}`;
    }
    
    return text;
  };

  const completeOrder = (paymentId) => {
    if (!cart || !Array.isArray(cart)) {
      console.error('completeOrder called with invalid cart');
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const tokenNumber = `${settings.tokenPrefix || 'T'}-${Date.now().toString().slice(-4)}`;
    const newOrder = {
      id: orderNumber,
      orderNumber: orderNumber,
      token: tokenNumber,
      items: cart,
      total: cartTotal || 0,
      subtotal: cartSubtotal || 0,
      discount: discount || 0,
      discountAmount: discountAmount || 0,
      gstEnabled: gstEnabled,
      gstRate: gstRate || 0,
      taxAmount: taxAmount || 0,
      paymentMethod: paymentMethod || 'CASH',
      paymentId: paymentId,
      splitPayments: paymentMethod === 'SPLIT' ? splitPayments : null,
      receiptType: 'thermal',
      receiptDelivery: receiptDelivery,
      receiptEmail: receiptEmail,
      receiptPhone: receiptPhone,
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
        paymentMethod: paymentMethod || 'CASH',
        paymentId: paymentId,
        terminalId: currentTerminal?.id || 'terminal_1'
      }
    };

    setOrders(prev => [...(prev || []), newOrder]);
    setLastOrder(newOrder);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setPaymentMethod('CASH');
    setShowPaymentModal(false);
    setShowReceipt(true);
    setReceiptDelivery('none');
    setReceiptEmail('');
    setReceiptPhone('');

    // Send receipts if requested
    if (receiptDelivery === 'email' && receiptEmail) {
      sendEmailReceipt(newOrder, receiptEmail);
    } else if (receiptDelivery === 'sms' && receiptPhone) {
      sendSMSReceipt(newOrder, receiptPhone);
    } else if (receiptDelivery === 'both') {
      if (receiptEmail) sendEmailReceipt(newOrder, receiptEmail);
      if (receiptPhone) sendSMSReceipt(newOrder, receiptPhone);
    }

    // Create KOT for kitchen based on workflow settings
    console.log('=== KOT CREATION DEBUG ===');
    console.log('Creating KOT - autoCreateKOT setting:', settings.autoCreateKOT);
    console.log('KOT Manager instance:', kotManager);
    console.log('KOT Manager methods:', Object.keys(kotManager || {}));
    
    // Always create KOT regardless of payment (for better kitchen visibility)
    if (settings.autoCreateKOT !== false) { // Default to true if not set
      try {
        console.log('Creating KOT with data:', {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          token: newOrder.token,
          items: newOrder.items
        });
        if (!kotManager || !kotManager.createKOT) {
          console.error('KOT manager not available or missing createKOT method');
          console.log('kotManager type:', typeof kotManager);
          console.log('createKOT exists:', kotManager?.createKOT !== undefined);
          return;
        }
        const kotResult = kotManager.createKOT({
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          token: newOrder.token,
          items: newOrder.items || [],
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          tableNumber: newOrder.tableNumber,
          staffId: newOrder.staffId,
          staffName: newOrder.staffName,
          terminal: newOrder.terminal,
          notes: newOrder.notes || ''
        });

        console.log('KOT creation result:', kotResult);
        console.log('KOT creation success:', kotResult?.success);

        if (kotResult && kotResult.success) {
          console.log('KOT created successfully:', kotResult.kot?.kotId);
          console.log('Current KOTs in manager:', kotManager.getAllKOTs()?.length);

          // Auto-print KOT if enabled
          if (settings.autoPrintKOT && kotPrinter && kotPrinter.printKOTForAllStations) {
            try {
              kotPrinter.printKOTForAllStations(kotResult.kot);
            } catch (printError) {
              console.error('Error printing KOT:', printError);
            }
          }
        } else {
          console.error('KOT creation failed:', kotResult?.error);
        }
      } catch (kotError) {
        console.error('Error creating KOT:', kotError);
      }
    } else {
      console.log('KOT auto-creation disabled in settings');
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
          ? { ...t, status: 'occupied', currentToken: newOrder.token, currentOrderId: newOrder.id }
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

  // Aggregator_ORDER handlers
  const handleAcceptAggregatorOrder = async (orderId) => {
    try {
      // Call real API through aggregator service
      await aggregatorService.acceptOrder(orderId, 30); // 30 min prep time
      
      // Update local state
      setAggregatorOrders(aggregatorService.getOrders());
      
      // Convert aggregator order to POS cart
      const order = aggregatorService.getOrder(orderId);
      if (order) {
        // Parse items string and add to cart
        const itemMatches = order.items.match(/(.+?) x(\d+)/g);
        if (itemMatches) {
          itemMatches.forEach(match => {
            const [, itemName, qty] = match.match(/(.+?) x(\d+)/);
            const menuItem = menuItems.find(m => m.name === itemName);
            if (menuItem) {
              addToCart(menuItem, parseInt(qty));
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to accept aggregator order:', error);
      setAlertMessage(`Failed to accept order: ${error.message}`);
      setShowAlert(true);
    }
  };

  const handleRejectAggregatorOrder = async (orderId) => {
    try {
      if (confirm('Are you sure you want to reject this order?')) {
        // Call real API through aggregator service
        await aggregatorService.rejectOrder(orderId, 'Restaurant rejected');
        
        // Update local state
        setAggregatorOrders(aggregatorService.getOrders());
      }
    } catch (error) {
      console.error('Failed to reject aggregator order:', error);
      setAlertMessage(`Failed to reject order: ${error.message}`);
      setShowAlert(true);
    }
  };

  const handleAggregatorOrderStatusChange = async (orderId, newStatus) => {
    try {
      // Call real API through aggregator service
      await aggregatorService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setAggregatorOrders(aggregatorService.getOrders());
    } catch (error) {
      console.error('Failed to update aggregator order status:', error);
      setAlertMessage(`Failed to update status: ${error.message}`);
      setShowAlert(true);
    }
  };

  const pendingAggregatorOrders = aggregatorOrders.filter(o => o.status === 'pending').length;

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
    console.log('Creating KOT for split payment with data:', {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      token: newOrder.token,
      items: newOrder.items
    });
    
    try {
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

      console.log('Split payment KOT creation result:', kotResult);

      if (kotResult.success) {
        console.log('KOT created for split payment:', kotResult.kot.kotId);
        
        // Auto-print KOT if enabled
        if (settings.autoPrintKOT) {
          try {
            kotPrinter.printKOTForAllStations(kotResult.kot);
          } catch (printError) {
            console.error('Error printing KOT:', printError);
          }
        }
      } else {
        console.error('KOT creation failed for split payment:', kotResult.error);
      }
    } catch (kotError) {
      console.error('Error during KOT creation for split payment:', kotError);
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
    
    let receiptHTML = `
      <div style="
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        padding: 16px;
        background: #fff;
        max-width: 280px;
        margin: 0 auto;
        border: 2px solid #000;
      ">
    `;
    
    // Header with logo and store info
    receiptHTML += `
      <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px dashed #000; padding-bottom: 12px;">
    `;
    if (settings.storeLogo) {
      receiptHTML += `<img src="${settings.storeLogo}" alt="Store Logo" style="width: 60px; height: 60px; margin: 0 auto 8px; display: block; object-fit: contain;" />`;
    }
    receiptHTML += `<div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${settings.storeName || 'BakeryPOS'}</div>`;
    if (settings.storeAddress) {
      receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">${settings.storeAddress}</div>`;
    }
    if (settings.phone) {
      receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">Tel: ${settings.phone}</div>`;
    }
    receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">GSTIN: ${settings.gstin || 'N/A'}</div>`;
    receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">FSSAI: ${settings.fssaiLicense || 'N/A'}</div>`;
    receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">Tariff: ${settings.tariffCode || 'N/A'}</div>`;
    receiptHTML += `</div>`;
    
    // Order Info
    receiptHTML += `
      <div style="margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Order #: ${lastOrder.id}</span>
          <span>Token: ${lastOrder.token || 'N/A'}</span>
        </div>
        <div style="font-size: 10px; margin-bottom: 2px;">${new Date(lastOrder.createdAt).toLocaleString()}</div>
    `;
    if (lastOrder.tableNumber) {
      receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">Table: ${lastOrder.tableNumber}</div>`;
    }
    receiptHTML += `<div style="font-size: 10px; margin-bottom: 2px;">Customer: ${lastOrder.customerName || 'Walk-in'}</div>`;
    receiptHTML += `<div style="font-size: 10px;">Staff: ${lastOrder.staffName || 'N/A'}</div>`;
    receiptHTML += `</div>`;

    // Items
    receiptHTML += `<div style="margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px;">`;
    lastOrder.items.forEach(item => {
      receiptHTML += `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="font-weight: 500;">${item.name}</span>
            <span>₹${(item.quantity * item.price).toFixed(2)}</span>
          </div>
          <div style="font-size: 10px; color: #666;">${item.quantity} x ₹${item.price.toFixed(2)}</div>
      `;
      if (item.isCustom) {
        receiptHTML += `<div style="font-size: 10px; color: #92400e; margin-top: 2px;">⚙️ Custom${item.baseItemName ? ` (Base: ${item.baseItemName})` : ''}</div>`;
      }
      if (item.notes) {
        const noteColor = item.noteType === 'allergy' ? '#dc2626' : '#666';
        const noteWeight = item.noteType === 'allergy' ? 'bold' : 'normal';
        const notePrefix = item.noteType === 'allergy' ? '⚠️ ' : '📝 ';
        receiptHTML += `<div style="font-size: 10px; color: ${noteColor}; margin-top: 2px; font-weight: ${noteWeight};">${notePrefix}${item.notes}</div>`;
      }
      receiptHTML += `</div>`;
    });
    receiptHTML += `</div>`;

    // Totals
    receiptHTML += `
      <div style="border-top: 2px solid #000; padding-top: 8px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Subtotal:</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
    `;
    if ((lastOrder.discount || 0) > 0) {
      receiptHTML += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Discount (${lastOrder.discount}%):</span>
          <span>-₹${discountAmt.toFixed(2)}</span>
        </div>
      `;
    }
    if (lastOrder.gstEnabled !== false && (lastOrder.gstRate || 0) > 0) {
      receiptHTML += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>GST (${lastOrder.gstRate}%):</span>
          <span>₹${taxAmt.toFixed(2)}</span>
        </div>
      `;
    }
    receiptHTML += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; border-top: 1px solid #000; padding-top: 8px;">
          <span>TOTAL:</span>
          <span>₹${lastOrder.total.toFixed(2)}</span>
        </div>
        <div style="font-size: 10px; margin-top: 4px;">
          Paid: ${lastOrder.splitPayments && lastOrder.splitPayments.length > 0 ? 'Split' : lastOrder.paymentMethod}
        </div>
    `;
    if (lastOrder.splitPayments && lastOrder.splitPayments.length > 0) {
      receiptHTML += `<div style="font-size: 10px;">`;
      lastOrder.splitPayments.forEach(payment => {
        receiptHTML += `<div>${payment.method}: ₹${payment.amount.toFixed(2)}</div>`;
      });
      receiptHTML += `</div>`;
    }
    receiptHTML += `</div>`;

    // Footer with QR code
    receiptHTML += `
      <div style="text-align: center; margin-top: 12px; border-top: 1px dashed #000; padding-top: 12px;">
        <div style="font-size: 11px; margin-bottom: 8px;">${settings.receiptFooter || 'Thank you for your order!'}</div>
    `;
    if (settings.googleReviewUrl) {
      receiptHTML += `
        <div style="margin-top: 12px;">
          <div style="font-size: 10px; margin-bottom: 6px;">Scan to review us:</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(settings.googleReviewUrl.trim())}" alt="Google Review QR" style="width: 80px; height: 80px; margin: 0 auto; display: block; border: 1px solid #000;" />
        </div>
      `;
    }
    receiptHTML += `</div>`;
    receiptHTML += `</div>`;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${lastOrder.id}</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>${receiptHTML}</body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleNumpadClick = (value) => {
    if (isEditingCartItems) {
      // Handle cart item editing
      if (value === 'C') {
        if (itemActionMode === 'quantity') setQuantityInput('1');
        else if (itemActionMode === 'discount') setDiscount(0);
        else if (itemActionMode === 'amount') setQuantityInput('0');
        setIsEditingCartItems(false);
        clearCartSelection();
      } else if (value === '⌫') {
        if (itemActionMode === 'quantity') {
          setQuantityInput(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
        } else if (itemActionMode === 'discount') {
          setDiscount(0);
        } else if (itemActionMode === 'amount') {
          setQuantityInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        }
      } else {
        if (itemActionMode === 'quantity') {
          setQuantityInput(prev => prev === '0' ? value : prev + value);
        } else if (itemActionMode === 'discount') {
          const newValue = parseInt(value);
          if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
            setDiscount(newValue);
          }
        } else if (itemActionMode === 'amount') {
          setQuantityInput(prev => prev === '0' ? value : prev + value);
        }
      }
    } else {
      // Normal numpad behavior
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
        setAlertMessage('Keyboard Shortcuts:\nF1 - Help\nF2 - Checkout\nF3 - Hold Order\nF4 - Void Last Item\nF5 - Discount Toggle\nF6 - Tax Toggle\nF7 - Print Receipt\nF8 - Order History\nF9 - Quick Code Focus\nF10 - Clear Cart\nF11 - Fullscreen\nF12 - Settings\n1-6 - Quick Actions\nEscape - Close Modals\nEnter - Add Item (if selected)');
        setShowAlert(true);
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
        if (cart.length > 0) {
          setShowVoidConfirm(true);
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
      background: '#f1f5f9',
      overflow: 'auto',
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
            {/* Aggregator Orders Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAggregatorDropdown(!showAggregatorDropdown)}
                style={{
                  padding: '6px 12px',
                  background: pendingAggregatorOrders > 0 ? '#ef4444' : '#f3f4f6',
                  color: pendingAggregatorOrders > 0 ? '#ffffff' : '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                🍔 Aggregators
                {pendingAggregatorOrders > 0 && (
                  <span style={{
                    background: '#ffffff',
                    color: '#ef4444',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    {pendingAggregatorOrders}
                  </span>
                )}
              </button>

              {/* Aggregator Dropdown */}
              {showAggregatorDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: screenSize === 'small' ? '280px' : '400px',
                  maxWidth: screenSize === 'small' ? '90vw' : '500px',
                  maxHeight: screenSize === 'small' ? '400px' : '500px',
                  overflow: 'auto'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>📦 Aggregator Orders</span>
                    <button
                      onClick={() => setShowAggregatorPanel(true)}
                      style={{
                        padding: '4px 8px',
                        background: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  {aggregatorOrders.filter(o => o.status === 'pending').length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '13px' }}>No pending orders</div>
                    </div>
                  ) : (
                    aggregatorOrders.filter(o => o.status === 'pending').map(order => (
                      <div key={order.id} style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        background: '#ffffff'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                              color: '#ffffff'
                            }}>
                              {order.platform}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                              {order.orderId}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>{order.time}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {order.customer}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                          {order.items}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                            ₹{order.total}
                          </span>
                          <span style={{ fontSize: '11px', color: '#ef4444' }}>
                            Commission: ₹{order.commission}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptAggregatorOrder(order.id)}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Accept
                          </button>
                          <button
                            onClick={() => handleRejectAggregatorOrder(order.id)}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Held Orders Button */}
            {settings.enableHoldOrders && (
              <button
                onClick={() => setShowHeldOrders(true)}
                style={{
                  padding: '6px 12px',
                  background: heldOrders.length > 0 ? '#8b5cf6' : '#f3f4f6',
                  color: heldOrders.length > 0 ? '#ffffff' : '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                ⏸️ Held Orders
                {heldOrders.length > 0 && (
                  <span style={{
                    background: '#ffffff',
                    color: '#8b5cf6',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    {heldOrders.length}
                  </span>
                )}
              </button>
            )}

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
        gap: screenSize === 'small' ? '8px' : screenSize === 'medium' ? '8px' : '12px',
        padding: screenSize === 'small' ? '8px' : screenSize === 'medium' ? '8px' : '12px',
        overflow: 'auto',
        minHeight: 0,
        maxWidth: '100%',
        flexDirection: screenSize === 'small' ? 'column' : screenSize === 'medium' ? 'row' : 'row'
      }}>
        {/* Left Column - Menu */}
        {(screenSize !== 'small' || activeView === 'menu') && (
          <div style={{
            flex: screenSize === 'small' ? 1 : screenSize === 'medium' ? 1 : 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            minWidth: screenSize === 'small' ? '0' : screenSize === 'medium' ? '200px' : '280px',
            maxWidth: screenSize === 'small' ? '100%' : screenSize === 'medium' ? '40%' : 'none'
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
            padding: screenSize === 'small' ? '12px' : '16px'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: screenSize === 'small' ? '10px' : '12px'
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
                      padding: screenSize === 'small' ? '12px' : '16px',
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
                      minHeight: screenSize === 'small' ? '100px' : '120px'
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
                    <span style={{ fontSize: screenSize === 'small' ? '28px' : '32px' }}>{item.emoji || '🥐'}</span>
                    <span style={{ 
                      fontSize: screenSize === 'small' ? '11px' : '12px', 
                      fontWeight: '500', 
                      color: '#1f2937',
                      textAlign: 'center',
                      lineHeight: '1.3'
                    }}>
                      {item.name}
                    </span>
                    <span style={{ 
                      fontSize: screenSize === 'small' ? '13px' : '14px', 
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
            width: screenSize === 'small' ? '100%' : screenSize === 'medium' ? '280px' : '340px',
            minWidth: screenSize === 'small' ? '0' : screenSize === 'medium' ? '240px' : '320px',
            maxWidth: screenSize === 'small' ? '100%' : screenSize === 'medium' ? '320px' : '400px',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            flexShrink: 0
          }}>
          {/* Cart Header */}
          <div style={{
            padding: screenSize === 'small' ? '8px' : '10px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', color: '#1f2937' }}>
              Cart ({cartCount})
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '14px' : '15px', fontWeight: '700', color: '#2563eb' }}>
              ₹{cartTotal.toFixed(2)}
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: screenSize === 'small' ? '8px' : '10px' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: screenSize === 'small' ? '24px 12px' : '30px 15px',
                color: '#9ca3af',
                fontSize: screenSize === 'small' ? '11px' : '12px'
              }}>
                <div style={{ fontSize: screenSize === 'small' ? '32px' : '36px', marginBottom: '12px' }}>🛒</div>
                <div>Cart is empty</div>
              </div>
            ) : (
              cart.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  onClick={() => toggleCartItemSelection(index)}
                  style={{
                    background: selectedCartItems.includes(index) ? '#dbeafe' : '#f9fafb',
                    borderRadius: '6px',
                    padding: screenSize === 'small' ? '6px' : '8px',
                    marginBottom: screenSize === 'small' ? '4px' : '6px',
                    border: selectedCartItems.includes(index) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: screenSize === 'small' ? '4px' : '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', fontWeight: '500', color: '#1f2937' }}>
                          {selectedCartItems.includes(index) && <span style={{ marginRight: '4px' }}>✓</span>}
                          {item.name}
                          {item.isCustom && (
                            <span style={{ 
                              marginLeft: '4px', 
                              fontSize: '10px', 
                              padding: '1px 4px', 
                              borderRadius: '3px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #f59e0b',
                              fontWeight: '600'
                            }}>
                              Custom
                            </span>
                          )}
                          {item.notes && (
                            <span style={{ 
                              marginLeft: '4px', 
                              fontSize: '10px', 
                              padding: '1px 4px', 
                              borderRadius: '3px',
                              background: item.noteType === 'allergy' ? '#fef2f2' : '#dbeafe',
                              color: item.noteType === 'allergy' ? '#dc2626' : '#2563eb',
                              border: item.noteType === 'allergy' ? '1px solid #ef4444' : '1px solid #3b82f6',
                              fontWeight: '600'
                            }}>
                              {item.noteType === 'allergy' ? '⚠️' : '📝'}
                            </span>
                          )}
                        </div>
                        <SpeakButton
                          text={`${item.quantity} ${item.name} at ₹${item.price.toFixed(2)}`}
                          size="small"
                        />
                      </div>
                      <div style={{ fontSize: screenSize === 'small' ? '9px' : '10px', color: '#6b7280' }}>
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </div>
                      {item.baseItemName && (
                        <div style={{ fontSize: screenSize === 'small' ? '8px' : '9px', color: '#92400e', fontStyle: 'italic' }}>
                          Base: {item.baseItemName}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ 
                          fontSize: screenSize === 'small' ? '9px' : '10px', 
                          color: item.noteType === 'allergy' ? '#dc2626' : '#6b7280',
                          fontStyle: 'italic',
                          marginTop: '2px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.noteType === 'allergy' ? '⚠️ ' : '📝 '}{item.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(index);
                      }}
                      style={{
                        padding: screenSize === 'small' ? '2px 5px' : '3px 6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: screenSize === 'small' ? '11px' : '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: screenSize === 'small' ? '11px' : '12px', fontWeight: '600', color: '#1f2937' }}>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}

            {/* Item Actions Panel */}
            {selectedCartItems.length > 0 && (
              <div style={{ padding: screenSize === 'small' ? '6px' : '8px', borderTop: '1px solid #e5e7eb', background: '#dbeafe' }}>
                <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>
                  {selectedCartItems.length} item{selectedCartItems.length > 1 ? 's' : ''} selected
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  <button
                    onClick={() => {
                      setItemActionMode('quantity');
                      setNumpadMode('quantity');
                      setIsEditingCartItems(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: isEditingCartItems && itemActionMode === 'quantity' ? '#3b82f6' : '#ffffff',
                      color: isEditingCartItems && itemActionMode === 'quantity' ? 'white' : '#374151',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Qty
                  </button>
                  <button
                    onClick={() => {
                      setItemActionMode('discount');
                      setNumpadMode('discount');
                      setIsEditingCartItems(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: isEditingCartItems && itemActionMode === 'discount' ? '#3b82f6' : '#ffffff',
                      color: isEditingCartItems && itemActionMode === 'discount' ? 'white' : '#374151',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Discount
                  </button>
                  <button
                    onClick={() => {
                      setItemActionMode('amount');
                      setNumpadMode('amount');
                      setIsEditingCartItems(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: isEditingCartItems && itemActionMode === 'amount' ? '#3b82f6' : '#ffffff',
                      color: isEditingCartItems && itemActionMode === 'amount' ? 'white' : '#374151',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Amount
                  </button>
                  <button
                    onClick={() => {
                      setItemActionMode('notes');
                      setIsEditingCartItems(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: isEditingCartItems && itemActionMode === 'notes' ? '#3b82f6' : '#ffffff',
                      color: isEditingCartItems && itemActionMode === 'notes' ? 'white' : '#374151',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => {
                      clearCartSelection();
                      setIsEditingCartItems(false);
                      setNumpadMode('quantity');
                    }}
                    style={{
                      padding: '6px 8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Clear
                  </button>
                </div>

                {/* Notes input for notes mode */}
                {isEditingCartItems && itemActionMode === 'notes' && (
                  <div>
                    {/* Note type selector */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <button
                        onClick={() => setNoteType('regular')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: noteType === 'regular' ? '#3b82f6' : '#f3f4f6',
                          color: noteType === 'regular' ? 'white' : '#374151',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📝 Note
                      </button>
                      <button
                        onClick={() => setNoteType('allergy')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: noteType === 'allergy' ? '#ef4444' : '#f3f4f6',
                          color: noteType === 'allergy' ? 'white' : '#374151',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ⚠️ Allergy
                      </button>
                    </div>
                    <textarea
                      placeholder={noteType === 'allergy' ? 'Enter allergy information (no character limit)...' : 'Enter notes for selected items...'}
                      style={{
                        width: '100%',
                        minHeight: noteType === 'allergy' ? '80px' : '60px',
                        padding: '8px',
                        border: noteType === 'allergy' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        resize: 'vertical',
                        marginBottom: '6px',
                        background: noteType === 'allergy' ? '#fef2f2' : '#ffffff'
                      }}
                      onChange={(e) => {
                        const notes = e.target.value;
                        setCart(prev => {
                          return prev.map((item, index) => {
                            if (!selectedCartItems.includes(index)) return item;
                            return { ...item, notes, noteType };
                          });
                        });
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setIsEditingCartItems(false);
                          clearCartSelection();
                          setNumpadMode('quantity');
                          setNoteType('regular');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#22c55e',
                          border: '1px solid #22c55e',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCartItems(false);
                          clearCartSelection();
                          setNumpadMode('quantity');
                          setNoteType('regular');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#6b7280',
                          border: '1px solid #6b7280',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions for numpad modes */}
                {isEditingCartItems && itemActionMode !== 'notes' && (
                  <div style={{ 
                    padding: '8px', 
                    background: '#dbeafe', 
                    border: '1px solid #3b82f6', 
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#1e40af',
                    textAlign: 'center'
                  }}>
                    Use the main numpad to enter {itemActionMode}. Press C to cancel.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div style={{ padding: screenSize === 'small' ? '6px' : '8px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
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
            width: screenSize === 'small' ? '100%' : screenSize === 'medium' ? '240px' : '280px',
            minWidth: screenSize === 'small' ? '0' : screenSize === 'medium' ? '200px' : '260px',
            maxWidth: screenSize === 'small' ? '100%' : screenSize === 'medium' ? '280px' : '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: screenSize === 'small' ? '8px' : '12px',
            overflowY: 'auto',
            paddingRight: screenSize === 'small' ? '4px' : '0',
            flexShrink: 0
          }}>
          {/* Quick Actions */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: screenSize === 'small' ? '6px' : '8px'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', fontWeight: '600', color: '#1f2937', marginBottom: screenSize === 'small' ? '4px' : '6px' }}>
              Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: screenSize === 'small' ? '3px' : '4px' }}>
              {[
                { id: 'hold', label: 'Hold', icon: '⏸️' },
                { id: 'voice', label: 'Voice', icon: '🎤' },
                { id: 'void', label: 'Void', icon: '❌' },
                { id: 'discount', label: 'Disc', icon: '🏷️' },
                { id: 'print', label: 'Print', icon: '🖨️' },
                { id: 'table', label: 'Table', icon: '🪑' }
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'hold') handleHoldOrder();
                    if (action.id === 'voice') setShowVoiceOrder(true);
                    if (action.id === 'void') handleVoidLastItem();
                    if (action.id === 'discount') setDiscount(discount === 0 ? 10 : 0);
                    if (action.id === 'print') setShowPrintSettings(true);
                    if (action.id === 'table') setShowTableSelector(true);
                    if (action.id === 'kitchen') {
                      // Show kitchen status - could be a modal or navigate to kitchen view
                      setAlertMessage('Kitchen Status: All orders are being processed');
                      setShowAlert(true);
                    }
                  }}
                  style={{
                    padding: screenSize === 'small' ? '5px 3px' : '6px 4px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: screenSize === 'small' ? '8px' : '9px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: screenSize === 'small' ? '11px' : '12px' }}>{action.icon}</span>
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
            padding: screenSize === 'small' ? '6px' : '8px',
            flex: 1
          }}>
            {/* Numpad Mode Toggle */}
            <div style={{ display: 'flex', gap: screenSize === 'small' ? '3px' : '4px', marginBottom: screenSize === 'small' ? '4px' : '6px' }}>
              {['quantity', 'discount', 'amount'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setNumpadMode(mode);
                    if (isEditingCartItems) setItemActionMode(mode);
                  }}
                  style={{
                    flex: 1,
                    padding: screenSize === 'small' ? '3px' : '4px',
                    background: numpadMode === mode ? '#2563eb' : '#f3f4f6',
                    color: numpadMode === mode ? '#ffffff' : '#374151',
                    border: isEditingCartItems && itemActionMode === mode ? '2px solid #3b82f6' : 'none',
                    borderRadius: '3px',
                    fontSize: screenSize === 'small' ? '9px' : '10px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Cart editing indicator */}
            {isEditingCartItems && (
              <div style={{ 
                padding: '6px 8px', 
                background: '#dbeafe', 
                border: '1px solid #3b82f6', 
                borderRadius: '4px',
                fontSize: screenSize === 'small' ? '9px' : '10px',
                color: '#1e40af',
                textAlign: 'center',
                marginBottom: screenSize === 'small' ? '4px' : '6px',
                fontWeight: '500'
              }}>
                Editing {selectedCartItems.length} cart item{selectedCartItems.length > 1 ? 's' : ''} - {itemActionMode}
              </div>
            )}

            {/* Numpad Search */}
            <div style={{ marginBottom: screenSize === 'small' ? '4px' : '6px', position: 'relative' }}>
              <input
                type="text"
                value={numpadSearch}
                onChange={(e) => setNumpadSearch(e.target.value)}
                placeholder="🔍 Search..."
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '5px 6px' : '6px 8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: screenSize === 'small' ? '10px' : '11px',
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
            
            <div style={{ fontSize: screenSize === 'small' ? '9px' : '10px', fontWeight: '600', color: '#64748b', marginBottom: screenSize === 'small' ? '3px' : '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                padding: screenSize === 'small' ? '6px' : '8px',
                background: '#ffffff',
                color: '#0f172a',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '14px' : '16px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: screenSize === 'small' ? '4px' : '6px',
                fontFamily: 'monospace',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: screenSize === 'small' ? '3px' : '4px' }}>
              {isEditingCartItems ? (
                // Show confirm button when editing cart items
                <>
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(key => (
                    <button
                      key={key}
                      onClick={() => handleNumpadClick(key)}
                      style={{
                        padding: screenSize === 'small' ? '8px' : '10px',
                        background: '#f3f4f6',
                        color: '#1f2937',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: screenSize === 'small' ? '13px' : '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f3f4f6';
                      }}
                    >
                      {key}
                    </button>
                  ))}
                  <button
                    onClick={applyItemAction}
                    style={{
                      padding: screenSize === 'small' ? '8px' : '10px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#16a34a';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#22c55e';
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleNumpadClick('0')}
                    style={{
                      padding: screenSize === 'small' ? '8px' : '10px',
                      background: '#f3f4f6',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f3f4f6';
                    }}
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleNumpadClick('⌫')}
                    style={{
                      padding: screenSize === 'small' ? '8px' : '10px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fee2e2';
                    }}
                  >
                    ⌫
                  </button>
                </>
              ) : (
                // Normal numpad
                ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫'].map(key => (
                  <button
                    key={key}
                    onClick={() => handleNumpadClick(key)}
                    style={{
                      padding: screenSize === 'small' ? '8px' : '10px',
                      background: key === 'C' || key === '⌫' ? '#fee2e2' : '#f3f4f6',
                      color: key === 'C' || key === '⌫' ? '#dc2626' : '#1f2937',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
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
                ))
              )}
            </div>
          </div>

          {/* Custom Order */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: screenSize === 'small' ? '8px' : '12px'
          }}>
            <button
              onClick={() => setShowCustomOrder(true)}
              style={{
                width: '100%',
                padding: screenSize === 'small' ? '8px' : '10px',
                background: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '12px' : '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: screenSize === 'small' ? '14px' : '16px' }}>✨</span>
              Custom Order
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '400px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw'
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '500px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw'
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
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '32px',
            width: screenSize === 'small' ? '95vw' : '500px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
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
                  setSelectedBaseItem(null);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>

            {/* Base Item Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
                Base Menu Item (Optional)
              </label>
              <select
                value={selectedBaseItem?.id || ''}
                onChange={(e) => {
                  const item = menuItems.find(m => m.id === e.target.value);
                  setSelectedBaseItem(item || null);
                  if (item) {
                    setCustomOrderName(item.name);
                    setCustomOrderPrice(item.price.toString());
                    setCustomOrderCategory(item.category);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2d2d44',
                  border: '1px solid #3d3d5c',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select a menu item (optional)</option>
                {menuItems.filter(item => item.active !== false).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ₹{item.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Add-ons
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Extra Sauce', price: 10 },
                  { name: 'Extra Cheese', price: 15 },
                  { name: 'Takeaway Box', price: 15 },
                  { name: 'Tissues', price: 5 }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomOrderName(preset.name);
                      setCustomOrderPrice(preset.price.toString());
                      setCustomOrderCategory('Add-ons');
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#2d2d44',
                      color: '#e0e0e0',
                      border: '1px solid #3d3d5c',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#3d3d5c'}
                    onMouseLeave={(e) => e.target.style.background = '#2d2d44'}
                  >
                    {preset.name} (₹{preset.price})
                  </button>
                ))}
              </div>
            </div>

            {/* Order Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
                Order Name
              </label>
              <input
                type="text"
                value={customOrderName}
                onChange={(e) => setCustomOrderName(e.target.value)}
                placeholder="Enter item name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1a2e',
                  color: '#ffffff',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Price and Quantity Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={customOrderPrice}
                  onChange={(e) => setCustomOrderPrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
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
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
                Category
              </label>
              <select
                value={customOrderCategory}
                onChange={(e) => setCustomOrderCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1a2e',
                  color: '#ffffff',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
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
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
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
                  background: '#1a1a2e',
                  color: '#ffffff',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* Preview */}
            {customOrderName && customOrderPrice && (
              <div style={{
                background: '#2d2d44',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #3d3d5c'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e0e0e0', marginBottom: '4px' }}>
                  Preview
                </div>
                <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
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
                  setSelectedBaseItem(null);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!customOrderName || !customOrderPrice) {
                    setAlertMessage('Please fill in required fields');
                    setShowAlert(true);
                    return;
                  }
                  const customItem = {
                    id: `custom-${Date.now()}`,
                    name: customOrderName,
                    price: parseFloat(customOrderPrice),
                    quantity: parseInt(customOrderQuantity) || 1,
                    category: customOrderCategory || 'Custom',
                    notes: customOrderNotes,
                    isCustom: true,
                    baseItemId: selectedBaseItem?.id || null,
                    baseItemName: selectedBaseItem?.name || null
                  };
                  setCart([...cart, customItem]);
                  setShowCustomOrder(false);
                  setCustomOrderName('');
                  setCustomOrderPrice('');
                  setCustomOrderQuantity('1');
                  setCustomOrderNotes('');
                  setCustomOrderCategory('');
                  setSelectedBaseItem(null);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '600px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw',
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '400px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw'
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '400px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw'
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
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '100%',
            maxWidth: screenSize === 'small' ? '95vw' : '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Checkout
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Summary */}
            <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#8b8b9e' }}>Subtotal</span>
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#ffffff' }}>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#8b8b9e' }}>Discount ({discount}%)</span>
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#10b981' }}>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {gstEnabled && taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#8b8b9e' }}>GST ({gstRate}%)</span>
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#ffffff' }}>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #2d2d44' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Settings Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => setDiscount(discount === 0 ? 10 : 0)}
                  style={{
                    padding: '10px',
                    background: discount > 0 ? '#10b981' : '#2d2d44',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🏷️ {discount > 0 ? `${discount}% Off` : 'No Discount'}
                </button>
                <button
                  onClick={() => setGstEnabled(!gstEnabled)}
                  style={{
                    padding: '10px',
                    background: gstEnabled ? '#6366f1' : '#2d2d44',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🧾 GST: {gstEnabled ? 'On' : 'Off'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2d2d44', borderRadius: '8px', padding: '0 12px' }}>
                <input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  disabled={!gstEnabled}
                  style={{
                    width: '50px',
                    padding: '8px 0',
                    background: 'transparent',
                    color: gstEnabled ? '#ffffff' : '#8b8b9e',
                    border: 'none',
                    borderRadius: '0',
                    fontSize: '12px',
                    fontWeight: '600',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: '#8b8b9e', fontSize: '12px' }}>%</span>
              </div>
            </div>

            {/* Receipt Options */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8b8b9e', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Receipt Options
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2d2d44', borderRadius: '8px', padding: '0 12px' }}>
                  <select
                    value={receiptDelivery}
                    onChange={(e) => setReceiptDelivery(e.target.value)}
                    style={{
                      padding: '8px 0',
                      background: 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    <option value="none">Print Only</option>
                    <option value="email">📧 Email</option>
                    <option value="sms">📱 SMS</option>
                    <option value="both">Email + SMS</option>
                  </select>
                </div>
              </div>
              
              {(receiptDelivery === 'email' || receiptDelivery === 'both') && (
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#1a1a2e',
                      color: '#ffffff',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
              
              {(receiptDelivery === 'sms' || receiptDelivery === 'both') && (
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="tel"
                    value={receiptPhone}
                    onChange={(e) => setReceiptPhone(e.target.value)}
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#1a1a2e',
                      color: '#ffffff',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8b8b9e', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'CASH', label: 'Cash', icon: '💵' },
                  { id: 'CARD', label: 'Card', icon: '💳' },
                  { id: 'UPI', label: 'UPI', icon: '📱' },
                  { id: 'WALLET', label: 'Wallet', icon: '👛' },
                  { id: 'SPLIT', label: 'Split', icon: '💰' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id === 'SPLIT') {
                        setSplitPayments([{ method: 'CASH', amount: cartTotal }]);
                      }
                    }}
                    style={{
                      padding: '16px 12px',
                      background: paymentMethod === method.id ? '#6366f1' : '#1a1a2e',
                      color: paymentMethod === method.id ? '#ffffff' : '#e0e0e0',
                      border: paymentMethod === method.id ? '2px solid #6366f1' : '1px solid #2d2d44',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{method.icon}</span>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Payment Interface */}
            {paymentMethod === 'SPLIT' && (
              <div style={{ marginBottom: '24px', background: '#1a1a2e', padding: '16px', borderRadius: '8px', border: '1px solid #2d2d44' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#8b8b9e' }}>
                    Split Payment Details
                  </label>
                  <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>
                    Remaining: ₹{(cartTotal - splitPayments.reduce((sum, p) => sum + (p.amount || 0), 0)).toFixed(2)}
                  </div>
                </div>
                
                {/* Split by People */}
                <div style={{ marginBottom: '12px', padding: '12px', background: '#2d2d44', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#8b8b9e' }}>Split equally among:</span>
                    <input
                      type="number"
                      value={splitByPeople}
                      onChange={(e) => setSplitByPeople(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="1"
                      max="20"
                      style={{
                        width: '60px',
                        padding: '6px 8px',
                        background: '#1a1a2e',
                        color: '#ffffff',
                        border: '1px solid #3d3d5c',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#8b8b9e' }}>people</span>
                    <button
                      onClick={() => {
                        if (splitByPeople > 0) {
                          const amountPerPerson = cartTotal / splitByPeople;
                          const newPayments = [];
                          for (let i = 0; i < splitByPeople; i++) {
                            newPayments.push({ method: 'CASH', amount: amountPerPerson });
                          }
                          setSplitPayments(newPayments);
                        }
                      }}
                      disabled={splitByPeople < 1}
                      style={{
                        padding: '6px 12px',
                        background: splitByPeople >= 1 ? '#6366f1' : '#2d2d44',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: splitByPeople >= 1 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Apply Split
                    </button>
                  </div>
                  {splitByPeople > 0 && (
                    <div style={{ fontSize: '12px', color: '#8b8b9e' }}>
                      Each person pays: ₹{(cartTotal / splitByPeople).toFixed(2)}
                    </div>
                  )}
                </div>

                {splitPayments.map((payment, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <select
                      value={payment.method}
                      onChange={(e) => {
                        const updated = [...splitPayments];
                        updated[index].method = e.target.value;
                        setSplitPayments(updated);
                      }}
                      style={{
                        padding: '10px',
                        background: '#2d2d44',
                        color: '#ffffff',
                        border: '1px solid #3d3d5c',
                        borderRadius: '6px',
                        fontSize: '13px',
                        flex: 1
                      }}
                    >
                      <option value="CASH">💵 Cash</option>
                      <option value="CARD">💳 Card</option>
                      <option value="UPI">📱 UPI</option>
                      <option value="WALLET">👛 Wallet</option>
                    </select>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => {
                        const newAmount = parseFloat(e.target.value) || 0;
                        const updated = [...splitPayments];
                        updated[index].amount = newAmount;
                        
                        // Auto-fill remaining amount in the next payment row
                        const currentTotal = updated.reduce((sum, p) => sum + (p.amount || 0), 0);
                        const remaining = cartTotal - currentTotal;
                        
                        // Find the next payment row that's empty or has 0 amount
                        const nextEmptyIndex = updated.findIndex((p, i) => i > index && (!p.amount || p.amount === 0));
                        if (nextEmptyIndex !== -1 && remaining > 0) {
                          updated[nextEmptyIndex].amount = remaining;
                        } else if (remaining > 0 && index === splitPayments.length - 1) {
                          // If this is the last row and there's remaining, add a new row
                          updated.push({ method: 'CASH', amount: remaining });
                        }
                        
                        setSplitPayments(updated);
                      }}
                      placeholder="Amount"
                      style={{
                        padding: '10px',
                        background: '#2d2d44',
                        color: '#ffffff',
                        border: '1px solid #3d3d5c',
                        borderRadius: '6px',
                        fontSize: '13px',
                        width: '100px'
                      }}
                    />
                    {splitPayments.length > 1 && (
                      <button
                        onClick={() => {
                          setSplitPayments(splitPayments.filter((_, i) => i !== index));
                        }}
                        style={{
                          padding: '8px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setSplitPayments([...splitPayments, { method: 'CASH', amount: 0 }])}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2d2d44',
                    color: '#e0e0e0',
                    border: '1px dashed #3d3d5c',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  + Add Payment Method
                </button>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#8b8b9e' }}>
                  Total: ₹{splitPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)} / ₹{cartTotal.toFixed(2)}
                </div>
              </div>
            )}

            {/* Payment Amount Input for Card/UPI/Wallet */}
            {paymentMethod !== 'CASH' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#8b8b9e', marginBottom: '8px', display: 'block' }}>
                  Enter Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`₹${cartTotal.toFixed(2)}`}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Customer Info */}
            {selectedCustomer && (
              <div style={{ background: '#1a1a2e', padding: '12px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #2d2d44' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '12px', color: '#8b8b9e' }}>
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
                  padding: '16px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
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
                  padding: '16px',
                  background: (paymentMethod === 'CASH' || (paymentAmount && parseFloat(paymentAmount) >= cartTotal)) ? '#6366f1' : '#2d2d44',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (paymentMethod === 'CASH' || (paymentAmount && parseFloat(paymentAmount) >= cartTotal)) ? 'pointer' : 'not-allowed',
                  opacity: (paymentMethod === 'CASH' || (paymentAmount && parseFloat(paymentAmount) >= cartTotal)) ? 1 : 0.5
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
            padding: screenSize === 'small' ? '16px' : '24px',
            width: screenSize === 'small' ? '95vw' : '500px',
            maxWidth: screenSize === 'small' ? '95vw' : '90vw'
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
              {allOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontFamily: 'Georgia, serif' }}>
                  No orders yet
                </div>
              ) : (
                allOrders.slice(0, 20).map(order => (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderForView(order);
                      setShowOrderHistory(false);
                    }}
                    style={{
                      background: '#f5f0e6',
                      border: order.isQROrder ? '2px solid #8b5cf6' : '1px solid #d4c4a8',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>Order #{order.id.split('-')[1]}</span>
                        {order.isQROrder && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: '#8b5cf6',
                            color: '#ffffff'
                          }}>
                            QR
                          </span>
                        )}
                      </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8b7355', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                  <span>Subtotal</span>
                  <span style={{ fontFamily: '"Courier New", monospace' }}>₹{selectedOrderForView.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {selectedOrderForView.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8b7355', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                    <span>Discount ({selectedOrderForView.discount}%)</span>
                    <span style={{ fontFamily: '"Courier New", monospace' }}>-₹{selectedOrderForView.discountAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {selectedOrderForView.gstEnabled !== false && selectedOrderForView.taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8b7355', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                    <span>GST ({selectedOrderForView.gstRate}%)</span>
                    <span style={{ fontFamily: '"Courier New", monospace' }}>₹{selectedOrderForView.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {selectedOrderForView.splitPayments && selectedOrderForView.splitPayments.length > 0 && (
                  <div style={{ marginTop: '12px', marginBottom: '12px', padding: '12px', background: '#f5f0e6', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                      Split Payment
                    </div>
                    {selectedOrderForView.splitPayments.map((payment, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8b7355', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                        <span>{payment.method}</span>
                        <span style={{ fontFamily: '"Courier New", monospace' }}>₹{payment.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600', color: '#1a1a2e', fontFamily: 'Georgia, serif', marginTop: '12px' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: '"Courier New", monospace' }}>₹{selectedOrderForView.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b7355', fontFamily: 'Georgia, serif' }}>
                  Payment: {selectedOrderForView.paymentMethod || 'CASH'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {showVoidConfirm && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Void Last Item
            </h3>
            <p style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '24px' }}>
              Are you sure you want to remove the last item from the cart?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowVoidConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCart(cart.slice(0, -1));
                  setShowVoidConfirm(false);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Void Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Receipt
              </h3>
              <button
                onClick={() => setShowReceipt(false)}
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
            
            <div 
              id="receipt-preview"
              style={{ 
                fontFamily: 'Courier New, monospace',
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#000',
                padding: '16px',
                background: '#fff',
                borderRadius: '4px',
                border: '2px solid #000',
                maxWidth: '280px',
                margin: '0 auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {(() => {
                const subtotal = lastOrder.subtotal || lastOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discountAmt = lastOrder.discountAmount || (subtotal * (lastOrder.discount || 0)) / 100;
                const taxAmt = lastOrder.taxAmount || ((subtotal - discountAmt) * (lastOrder.gstRate || 0)) / 100;

                return (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px dashed #000', paddingBottom: '12px' }}>
                      {settings.storeLogo && (
                        <img 
                          src={settings.storeLogo} 
                          alt="Store Logo" 
                          style={{ width: '60px', height: '60px', margin: '0 auto 8px', display: 'block', objectFit: 'contain' }} 
                        />
                      )}
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {settings.storeName || 'BakeryPOS'}
                      </div>
                      {settings.storeAddress && (
                        <div style={{ fontSize: '10px', marginBottom: '2px' }}>{settings.storeAddress}</div>
                      )}
                      {settings.phone && (
                        <div style={{ fontSize: '10px', marginBottom: '2px' }}>Tel: {settings.phone}</div>
                      )}
                      <div style={{ fontSize: '10px', marginBottom: '2px' }}>GSTIN: {settings.gstin || 'N/A'}</div>
                      <div style={{ fontSize: '10px', marginBottom: '2px' }}>FSSAI: {settings.fssaiLicense || 'N/A'}</div>
                      <div style={{ fontSize: '10px', marginBottom: '2px' }}>Tariff: {settings.tariffCode || 'N/A'}</div>
                    </div>
                    
                    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Order #: {lastOrder.id}</span>
                        <span>Token: {lastOrder.token || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '10px', marginBottom: '2px' }}>{new Date(lastOrder.createdAt).toLocaleString()}</div>
                      {lastOrder.tableNumber && <div style={{ fontSize: '10px', marginBottom: '2px' }}>Table: {lastOrder.tableNumber}</div>}
                      <div style={{ fontSize: '10px', marginBottom: '2px' }}>Customer: {lastOrder.customerName || 'Walk-in'}</div>
                      <div style={{ fontSize: '10px' }}>Staff: {lastOrder.staffName || 'N/A'}</div>
                    </div>

                    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                      {lastOrder.items.map((item, index) => (
                        <div key={index} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                            <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{item.quantity} x ₹{item.price.toFixed(2)}</div>
                          {item.isCustom && (
                            <div style={{ fontSize: '10px', color: '#92400e', marginTop: '2px' }}>
                              ⚙️ Custom{item.baseItemName ? ` (Base: ${item.baseItemName})` : ''}
                            </div>
                          )}
                          {item.notes && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: item.noteType === 'allergy' ? '#dc2626' : '#666',
                              marginTop: '2px',
                              fontWeight: item.noteType === 'allergy' ? 'bold' : 'normal'
                            }}>
                              {item.noteType === 'allergy' ? '⚠️ ' : '📝 '}{item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '2px solid #000', paddingTop: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {(lastOrder.discount || 0) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Discount ({lastOrder.discount}%):</span>
                          <span>-₹{discountAmt.toFixed(2)}</span>
                        </div>
                      )}
                      {lastOrder.gstEnabled !== false && (lastOrder.gstRate || 0) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>GST ({lastOrder.gstRate}%):</span>
                          <span>₹{taxAmt.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '8px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <span>TOTAL:</span>
                        <span>₹{lastOrder.total.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        Paid: {lastOrder.splitPayments && lastOrder.splitPayments.length > 0 ? 'Split' : lastOrder.paymentMethod}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px dashed #000', paddingTop: '12px' }}>
                      <div style={{ fontSize: '11px', marginBottom: '8px' }}>{settings.receiptFooter || 'Thank you for your order!'}</div>
                      {settings.googleReviewUrl && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '10px', marginBottom: '6px' }}>Scan to review us:</div>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(settings.googleReviewUrl.trim())}`} 
                            alt="Google Review QR" 
                            style={{ width: '80px', height: '80px', margin: '0 auto', display: 'block', border: '1px solid #000' }} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ display: 'none', fontSize: '9px', color: '#dc2626', marginTop: '4px' }}>
                            QR Error - Check URL
                          </div>
                        </div>
                      )}
                      {!settings.googleReviewUrl && (
                        <div style={{ fontSize: '10px', marginTop: '8px', color: '#666' }}>
                          (Configure Google Review URL in Settings)
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={printReceipt}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  if (window.location.pathname.includes('dashboard')) {
                    window.dispatchEvent(new CustomEvent('navigateToTokens'));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                View Token
              </button>
              <button
                onClick={() => setShowReceipt(false)}
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
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Notice
            </h3>
            <p style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Order Modal */}
      {showVoiceOrder && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Voice Order
              </h3>
              <button
                onClick={() => setShowVoiceOrder(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            </div>
            
            <VoiceOrderRecorder
              menuItems={menuItems}
              onOrderParsed={handleVoiceOrderParsed}
              onCancel={() => setShowVoiceOrder(false)}
            />
          </div>
        </div>
      )}

      {/* Cart Restore Modal */}
      {showCartRestore && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>🛒</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Previous Cart Found
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <strong>Reason:</strong> {cartRestoreReason}
            </div>

            {restoredCart && (
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  {restoredCart.length} item(s) in cart
                </div>
                {restoredCart.slice(0, 3).map((item, index) => (
                  <div key={index} style={{ color: '#64748b', fontSize: '13px' }}>
                    {item.quantity} × {item.name}
                  </div>
                ))}
                {restoredCart.length > 3 && (
                  <div style={{ color: '#64748b', fontSize: '13px' }}>
                    +{restoredCart.length - 3} more item(s)
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDismissRestore}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleRestoreCart}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Restore Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aggregator Panel Modal */}
      {showAggregatorPanel && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                📦 All Aggregator Orders
              </h3>
              <button
                onClick={() => setShowAggregatorPanel(false)}
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

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Platform</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Items</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatorOrders.map((order, index) => (
                    <tr key={order.id} style={{ borderBottom: index < aggregatorOrders.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                          color: '#ffffff'
                        }}>
                          {order.platform}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{order.orderId}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.customer}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', maxWidth: '200px' }}>{order.items}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>₹{order.total}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>-₹{order.commission}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleAggregatorOrderStatusChange(order.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="delivered">Delivered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAcceptAggregatorOrder(order.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectAggregatorOrder(order.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
