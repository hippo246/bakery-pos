// Kitchen Display System (KDS)
// Real-time display of Kitchen Order Tickets for kitchen staff

import React, { useState, useEffect, useRef } from 'react';
import { getKOTManager } from '../../operations/KOTManager.js';
import { KOTStatus, KOTPriority, KitchenStation } from '../../domain/kotTypes.js';

// Advanced Speech Manager Class
class SpeechManager {
  constructor() {
    this.queue = [];
    this.isSpeaking = false;
    this.voices = [];
    this.selectedVoice = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.userInteracted = false;
    this.initialized = false;
    
    this.init();
  }

  async init() {
    if (this.initialized) return;
    
    try {
      if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        return;
      }

      // Load voices
      await this.loadVoices();
      
      // Track user interaction
      this.trackUserInteraction();
      
      this.initialized = true;
      console.log('Speech Manager initialized');
    } catch (error) {
      console.error('Error initializing Speech Manager:', error);
    }
  }

  async loadVoices() {
    return new Promise((resolve) => {
      const load = () => {
        this.voices = window.speechSynthesis.getVoices();
        console.log('Voices loaded:', this.voices.length);
        this.selectBestVoice();
        resolve();
      };

      load();
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    });
  }

  selectBestVoice() {
    if (this.voices.length === 0) {
      console.warn('No voices available');
      return;
    }

    // First, try to get English voices only
    const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en-'));
    
    if (englishVoices.length > 0) {
      // Prioritize specific English variants
      const priorities = [
        // Prefer US English
        (voice) => voice.lang === 'en-US',
        // Prefer UK English
        (voice) => voice.lang === 'en-GB',
        // Prefer Indian English
        (voice) => voice.lang === 'en-IN',
        // Prefer local service voices
        (voice) => voice.localService === true,
        // Prefer voices with full names
        (voice) => voice.name.length > 10
      ];

      let candidates = [...englishVoices];
      
      for (const priority of priorities) {
        if (candidates.length > 1) {
          candidates = candidates.filter(priority);
        }
      }

      this.selectedVoice = candidates[0] || englishVoices[0];
    } else {
      // Fallback to any voice if no English available
      this.selectedVoice = this.voices[0];
      console.warn('No English voices available, using fallback voice');
    }
    
    console.log('Selected voice:', this.selectedVoice?.name, this.selectedVoice?.lang);
  }

  trackUserInteraction() {
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    const handler = () => {
      this.userInteracted = true;
      console.log('User interaction detected for speech');
      events.forEach(event => document.removeEventListener(event, handler));
    };
    
    events.forEach(event => document.addEventListener(event, handler));
  }

  async speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Add to queue
    this.queue.push({ text, options });
    console.log('Speech queued:', text, 'Queue length:', this.queue.length);
    
    // Process queue
    this.processQueue();
    
    return true;
  }

  async processQueue() {
    if (this.isSpeaking || this.queue.length === 0) {
      return;
    }

    this.isSpeaking = true;
    const { text, options } = this.queue.shift();
    
    console.log('Processing speech:', text);
    
    try {
      const success = await this.speakNow(text, options);
      
      if (!success && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retry ${this.retryCount}/${this.maxRetries}`);
        // Put back in queue and retry
        this.queue.unshift({ text, options });
        setTimeout(() => this.processQueue(), 500);
      } else {
        this.retryCount = 0;
      }
    } catch (error) {
      console.error('Error in processQueue:', error);
      this.retryCount = 0;
    }

    this.isSpeaking = false;
    
    // Process next item
    setTimeout(() => this.processQueue(), 100);
  }

  async speakNow(text, options = {}) {
    return new Promise((resolve) => {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Resume if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        
        // Set properties
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Speech started:', text);
        };
        
        utterance.onend = () => {
          console.log('Speech completed:', text);
          // Cancel any ongoing speech to ensure silence after completion
          window.speechSynthesis.cancel();
          resolve(true);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error, event);
          
          // Handle specific errors
          if (event.error === 'not-allowed') {
            console.warn('Speech not allowed - may require user interaction');
          } else if (event.error === 'interrupted') {
            console.warn('Speech interrupted');
            resolve(true); // Don't retry on interruption
            return;
          } else if (event.error === 'canceled') {
            console.warn('Speech canceled');
            resolve(true);
            return;
          }
          
          resolve(false);
        };

        // Speak
        window.speechSynthesis.speak(utterance);
        
        // Timeout fallback
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            console.warn('Speech timeout, canceling');
            window.speechSynthesis.cancel();
          }
          resolve(true);
        }, 10000); // 10 second timeout
        
      } catch (error) {
        console.error('Error in speakNow:', error);
        resolve(false);
      }
    });
  }

  cancel() {
    window.speechSynthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
    console.log('Speech canceled');
  }

  isReady() {
    return this.initialized && this.voices.length > 0;
  }
}

export default function KitchenDisplaySystem({ screenSize = 'large', orders = [], setOrders, settings = {}, onSettingsChange, menuItems = [] }) {
  const [kotManager] = useState(() => getKOTManager());
  const [kots, setKots] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [lastKOTCount, setLastKOTCount] = useState(0);
  const [hasBeepedForCurrentOrders, setHasBeepedForCurrentOrders] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedOrderTypeFilter, setSelectedOrderTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showStationSettings, setShowStationSettings] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [allDayCounts, setAllDayCounts] = useState({});
  const [showCourseView, setShowCourseView] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showRecipePanel, setShowRecipePanel] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState({});
  const [previewTickets, setPreviewTickets] = useState([]);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const audioRef = useRef(null);
  const speechManagerRef = useRef(null);

  // Use settings or defaults
  const displaySettings = settings.display || {};
  const orderManagementSettings = settings.orderManagement || {};
  const stationSettings = settings.stations || {};
  const notificationSettings = settings.notifications || {};
  const performanceSettings = settings.performance || {};
  const advancedSettings = settings.advanced || {};

  // Kitchen stations with routing rules
  const [kitchenStations, setKitchenStations] = useState([
    { id: 'hot-kitchen', name: 'Hot Kitchen', categories: ['Main Course', 'Curry', 'Tandoor'], printer: 'printer-1', color: '#ef4444' },
    { id: 'cold-kitchen', name: 'Cold Kitchen', categories: ['Salad', 'Dessert', 'Beverage'], printer: 'printer-2', color: '#3b82f6' },
    { id: 'bakery', name: 'Bakery', categories: ['Bread', 'Pastry', 'Cake'], printer: 'printer-3', color: '#f59e0b' },
    { id: 'grill', name: 'Grill Station', categories: ['Grill', 'BBQ', 'Kebab'], printer: 'printer-1', color: '#10b981' }
  ]);

  // Course definitions
  const courses = [
    { id: 'appetizer', name: 'Appetizers', order: 1, color: '#f59e0b', delay: 0 },
    { id: 'soup', name: 'Soups', order: 2, color: '#f97316', delay: 5 },
    { id: 'main', name: 'Main Course', order: 3, color: '#ef4444', delay: 15 },
    { id: 'dessert', name: 'Desserts', order: 4, color: '#ec4899', delay: 30 },
    { id: 'beverage', name: 'Beverages', order: 5, color: '#3b82f6', delay: 0 }
  ];

  // Recipe database for chefs
  const recipes = {
    'Main Course': {
      instructions: ['Prep ingredients', 'Heat pan to medium-high', 'Cook for specified time', 'Garnish before serving'],
      prepTime: 15,
      cookTime: 20
    },
    'Curry': {
      instructions: ['Prepare base gravy', 'Add spices and aromatics', 'Simmer until thickened', 'Finish with cream'],
      prepTime: 10,
      cookTime: 25
    },
    'Tandoor': {
      instructions: ['Marinate meat', 'Preheat tandoor', 'Skewer and cook', 'Baste with ghee'],
      prepTime: 20,
      cookTime: 15
    },
    'Salad': {
      instructions: ['Wash and chop vegetables', 'Prepare dressing', 'Toss just before serving', 'Keep chilled'],
      prepTime: 8,
      cookTime: 0
    },
    'Dessert': {
      instructions: ['Prepare components', 'Assemble carefully', 'Chill if required', 'Add garnish last'],
      prepTime: 12,
      cookTime: 0
    },
    'Beverage': {
      instructions: ['Prepare glassware', 'Mix ingredients', 'Add ice if required', 'Garnish appropriately'],
      prepTime: 3,
      cookTime: 0
    }
  };

  // Allergy keywords for highlighting
  const allergyKeywords = ['allergy', 'allergic', 'nuts', 'peanut', 'gluten', 'dairy', 'milk', 'shellfish', 'egg', 'soy'];

  // Get course for item based on category
  const getItemCourse = (item) => {
    const category = item.category || 'Main Course';
    if (['Salad', 'Soup'].includes(category)) return category.toLowerCase();
    if (['Main Course', 'Curry', 'Tandoor', 'Grill', 'BBQ', 'Kebab'].includes(category)) return 'main';
    if (['Dessert', 'Pastry', 'Cake'].includes(category)) return 'dessert';
    if (['Beverage'].includes(category)) return 'beverage';
    if (['Bread', 'Appetizer'].includes(category)) return 'appetizer';
    return 'main';
  };

  // Check if item has allergy notes
  const hasAllergyAlert = (item) => {
    const notes = (item.notes || '').toLowerCase();
    return allergyKeywords.some(keyword => notes.includes(keyword));
  };

  // Calculate order age in minutes
  const getOrderAge = (createdAt) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    return Math.floor((now - created) / 1000 / 60);
  };

  // Get order aging color
  const getAgingColor = (age) => {
    if (age < 5) return '#10b981'; // Green - fresh
    if (age < 10) return '#f59e0b'; // Orange - getting old
    if (age < 15) return '#ef4444'; // Red - urgent
    return '#7f1d1d'; // Dark red - critical
  };

  // Suggest batch preparation for similar items
  const getBatchSuggestions = () => {
    const itemCounts = {};
    kots.forEach(kot => {
      kot.items.forEach(item => {
        if (item.status === 'PENDING') {
          const key = `${item.name}_${item.category}`;
          itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
        }
      });
    });

    const suggestions = [];
    Object.entries(itemCounts).forEach(([key, count]) => {
      if (count >= 3) {
        const [name, category] = key.split('_');
        suggestions.push({ name, category, count, station: routeItemToStation({ category }) });
      }
    });
    
    // If assembly lines is enabled, group items by station for efficient preparation
    if (stationSettings.assemblyLines) {
      const stationGroups = {};
      kots.forEach(kot => {
        kot.items.forEach(item => {
          if (item.status === 'PENDING') {
            const station = routeItemToStation(item);
            if (!stationGroups[station]) {
              stationGroups[station] = [];
            }
            stationGroups[station].push({ ...item, kotId: kot.kotId });
          }
        });
      });
      console.log('Assembly line groups:', stationGroups);
    }
    
    return suggestions;
  };

  // Available printers
  const [printers, setPrinters] = useState([
    { id: 'printer-1', name: 'Kitchen Printer 1', type: 'thermal', status: 'online' },
    { id: 'printer-2', name: 'Kitchen Printer 2', type: 'thermal', status: 'online' },
    { id: 'printer-3', name: 'Bar Printer', type: 'thermal', status: 'offline' }
  ]);

  // Initialize speech manager
  useEffect(() => {
    speechManagerRef.current = new SpeechManager();
    console.log('Speech Manager instance created');
  }, []);

  const loadKOTs = (shouldCheckForNewOrders = true) => {
    try {
      // If offline mode is enabled and we're offline, try to load from cache
      if (advancedSettings.offlineMode && !isOnline) {
        try {
          const cachedKOTs = localStorage.getItem('kitchenKOTsCache');
          const cachedTimestamp = localStorage.getItem('kitchenKOTsTimestamp');
          
          if (cachedKOTs && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp);
            // Use cache if it's less than 1 hour old
            if (cacheAge < 3600000) {
              console.log('Loading KOTs from offline cache');
              const parsedKOTs = JSON.parse(cachedKOTs);
              setKots(parsedKOTs);
              return;
            }
          }
        } catch (error) {
          console.error('Error loading from cache:', error);
        }
      }
      
      const allKOTs = kotManager.getAllKOTs();
      console.log('=== KOT LOADING DEBUG ===');
      console.log('Loading KOTs from manager:', allKOTs);
      console.log('KOT count:', allKOTs.length);
      console.log('KOT manager state:', kotManager);
      console.log('Current filters - station:', selectedStation, 'status:', selectedStatusFilter, 'orderType:', selectedOrderTypeFilter);
      
      // Also check for QR orders in localStorage and convert them to KOTs
      try {
        const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        const pendingQROrders = qrOrders.filter(order => order.status === 'PENDING');
        
        console.log('Found pending QR orders:', pendingQROrders.length);
        
        // Convert QR orders to KOT format if they don't exist in KOTs yet
        pendingQROrders.forEach(qrOrder => {
          const existingKOT = allKOTs.find(kot => kot.orderNumber === qrOrder.id);
          if (!existingKOT) {
            // Create KOT from QR order
            const kot = {
              id: `KOT-${qrOrder.id}`,
              orderNumber: qrOrder.id,
              items: qrOrder.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.qty,
                price: item.price,
                notes: item.notes || ''
              })),
              customer: {
                name: qrOrder.customerName,
                table: qrOrder.tableName || 'QR Order'
              },
              station: 'all',
              status: 'PENDING',
              priority: 'NORMAL',
              createdAt: qrOrder.createdAt,
              isQROrder: true
            };
            
            kotManager.createKOT(qrOrder.id, kot);
            console.log('Created KOT from QR order:', kot);
          }
        });
        
        // Reload KOTs after processing QR orders
        const updatedKOTs = kotManager.getAllKOTs();
        setLastKOTCount(updatedKOTs.length);
        setHasBeepedForCurrentOrders(false); // Reset beep flag when processing QR orders

        console.log('Updated KOT count after QR processing:', updatedKOTs.length);
        
        // Apply filters
        let filteredKOTs = updatedKOTs;
        
        console.log('Before filtering:', filteredKOTs.length);
        
        // Course-based separation - split orders by course if enabled
        if (orderManagementSettings.courseBasedSeparation && selectedCourse !== 'all') {
          filteredKOTs = filteredKOTs
            .map(kot => {
              // Filter items by selected course
              const courseItems = kot.items?.filter(item => getItemCourse(item) === selectedCourse);
              if (courseItems && courseItems.length > 0) {
                return { ...kot, items: courseItems, isCourseSplit: true };
              }
              return null;
            })
            .filter(kot => kot !== null);
          console.log('After course filter:', filteredKOTs.length);
        }
        
        // Filter by station
        if (selectedStation !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => kot.station === selectedStation);
          console.log('After station filter:', filteredKOTs.length);
        }
        
        // Filter by status
        if (selectedStatusFilter !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => kot.status === selectedStatusFilter);
          console.log('After status filter:', filteredKOTs.length);
        }
        
        // Filter by order type
        if (selectedOrderTypeFilter !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => {
            if (selectedOrderTypeFilter === 'qr') return kot.isQROrder;
            if (kot.orderType) return kot.orderType.toLowerCase() === selectedOrderTypeFilter;
            return false;
          });
          console.log('After order type filter:', filteredKOTs.length);
        }
        
        // Move ready tickets to front if enabled
        if (orderManagementSettings.moveReadyToFront) {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            if (a.status === 'READY' && b.status !== 'READY') return -1;
            if (a.status !== 'READY' && b.status === 'READY') return 1;
            return 0;
          });
        }
        
        // Apply sort order
        if (displaySettings.sortOrder === 'priority') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
            if (a.priority === 'high' && b.priority === 'normal') return -1;
            if (a.priority === 'normal' && b.priority === 'high') return 1;
            return 0;
          });
        } else if (displaySettings.sortOrder === 'station') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            return (a.station || '').localeCompare(b.station || '');
          });
        } else if (displaySettings.sortOrder === 'time') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
          });
        }
        
        console.log('Final filtered KOTs:', filteredKOTs.length);
        console.log('Filtered KOTs data:', filteredKOTs);
        
        // If offline mode is enabled, cache the KOTs locally
        if (advancedSettings.offlineMode) {
          try {
            localStorage.setItem('kitchenKOTsCache', JSON.stringify(filteredKOTs));
            localStorage.setItem('kitchenKOTsTimestamp', Date.now().toString());
          } catch (error) {
            console.error('Error caching KOTs for offline mode:', error);
          }
        }
        
        setKots(filteredKOTs);

        // Check for new orders and beep once (only if shouldCheckForNewOrders is true)
        if (shouldCheckForNewOrders && updatedKOTs.length > lastKOTCount) {
          const newKOTs = updatedKOTs.slice(lastKOTCount);
          console.log('New KOTs detected:', newKOTs);

          // Only beep for new orders if sound alerts are enabled
          if (notificationSettings.soundAlerts && newKOTs.length > 0 && !hasBeepedForCurrentOrders) {
            console.log('Sound enabled, playing beep for new orders');
            playAlertSound();
            setHasBeepedForCurrentOrders(true);
          } else {
            console.log('Sound disabled or already beeped or no new KOTs');
          }
        } else if (updatedKOTs.length < lastKOTCount) {
          // If orders were removed, reset the beep flag
          setHasBeepedForCurrentOrders(false);
        }
      } catch (error) {
        console.error('Error processing QR orders:', error);
        
        // Apply filters to allKOTs
        let filteredKOTs = allKOTs;
        
        // Course-based separation - split orders by course if enabled
        if (orderManagementSettings.courseBasedSeparation && selectedCourse !== 'all') {
          filteredKOTs = filteredKOTs
            .map(kot => {
              // Filter items by selected course
              const courseItems = kot.items?.filter(item => getItemCourse(item) === selectedCourse);
              if (courseItems && courseItems.length > 0) {
                return { ...kot, items: courseItems, isCourseSplit: true };
              }
              return null;
            })
            .filter(kot => kot !== null);
        }
        
        // Filter by station
        if (selectedStation !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => kot.station === selectedStation);
        }
        
        // Filter by status
        if (selectedStatusFilter !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => kot.status === selectedStatusFilter);
        }
        
        // Filter by order type
        if (selectedOrderTypeFilter !== 'all') {
          filteredKOTs = filteredKOTs.filter(kot => {
            if (selectedOrderTypeFilter === 'qr') return kot.isQROrder;
            if (kot.orderType) return kot.orderType.toLowerCase() === selectedOrderTypeFilter;
            return false;
          });
        }
        
        // Move ready tickets to front if enabled
        if (orderManagementSettings.moveReadyToFront) {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            if (a.status === 'READY' && b.status !== 'READY') return -1;
            if (a.status !== 'READY' && b.status === 'READY') return 1;
            return 0;
          });
        }
        
        // Apply sort order
        if (displaySettings.sortOrder === 'priority') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
            if (a.priority === 'high' && b.priority === 'normal') return -1;
            if (a.priority === 'normal' && b.priority === 'high') return 1;
            return 0;
          });
        } else if (displaySettings.sortOrder === 'station') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            return (a.station || '').localeCompare(b.station || '');
          });
        } else if (displaySettings.sortOrder === 'time') {
          filteredKOTs = filteredKOTs.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
          });
        }
        
        setKots(filteredKOTs);
        setLastKOTCount(allKOTs.length);
      }
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
      setStatistics({ active: 0, byStatus: { pending: 0 }, overdue: 0 });
    }
  };

  const playAlertSound = () => {
    // Temporarily disabled to prevent continuous beeping
    console.log('Alert sound disabled');
    return;

    if (!notificationSettings.soundAlerts) {
      console.log('Sound disabled, skipping beep');
      return;
    }

    try {
      console.log('Playing alert sound beep');
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  };

  const speakOrder = (kot) => {
    if (!notificationSettings.speechAnnouncements) {
      console.log('Speech disabled, skipping speakOrder');
      return;
    }
    
    if (!speechManagerRef.current || !speechManagerRef.current.isReady()) {
      console.warn('Speech manager not ready');
      return;
    }
    
    try {
      const message = `New order ${kot.orderNumber}. ${kot.customer?.name || 'Customer'} at ${kot.customer?.table || 'counter'}. ${kot.items?.map(item => `${item.quantity} ${item.name}`).join(', ') || 'No items'}`;
      console.log('Speaking order with SpeechManager:', message);
      
      speechManagerRef.current.speak(message, {
        rate: 0.9,
        pitch: 1,
        volume: 1
      });
    } catch (error) {
      console.error('Error in speakOrder:', error);
    }
  };

  // Route item to appropriate station based on category
  const routeItemToStation = (item) => {
    const category = item.category || 'Other';
    
    // If item-level routing is enabled, check for specific station assignment
    if (stationSettings.itemLevelRouting && item.station) {
      return item.station;
    }
    
    // Default routing by category
    for (const station of kitchenStations) {
      if (station.categories.includes(category)) {
        return station.id;
      }
    }
    return 'hot-kitchen'; // Default station
  };

  // Calculate preparation time for an item
  const calculatePrepTime = (item) => {
    const baseTimes = {
      'Main Course': 15,
      'Curry': 12,
      'Tandoor': 20,
      'Salad': 5,
      'Dessert': 8,
      'Beverage': 3,
      'Bread': 10,
      'Pastry': 15,
      'Cake': 25,
      'Grill': 18,
      'BBQ': 22,
      'Kebab': 15
    };
    return (baseTimes[item.category] || 10) * (item.quantity || 1);
  };

  // Calculate fire time for an order
  const calculateFireTime = (kot, item) => {
    const prepTime = calculatePrepTime(item);
    const createdAt = new Date(kot.createdAt).getTime();
    const readyAt = kot.estimatedReadyAt ? new Date(kot.estimatedReadyAt).getTime() : createdAt + (prepTime * 60 * 1000);
    const fireDelay = (advancedSettings.fireDelayMinutes || 5) * 60 * 1000;
    return Math.max(0, readyAt - fireDelay - Date.now());
  };

  // Smart priority calculation
  const calculateSmartPriority = (kot) => {
    if (!advancedSettings.smartPriority) return kot.priority;

    const now = Date.now();
    const waitTime = (now - new Date(kot.createdAt).getTime()) / 1000 / 60; // minutes
    const totalItems = kot.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const completedItems = kot.items.filter(item => item.status === 'COMPLETED').length;
    const progress = completedItems / totalItems;

    // Priority score calculation
    let score = 0;
    
    // Wait time factor (higher wait time = higher priority)
    score += Math.min(waitTime / 30, 3) * 30; // Max 30 points for wait time
    
    // Order size factor (smaller orders get slight priority)
    score += Math.max(0, 10 - totalItems) * 5;
    
    // Progress factor (orders near completion get priority)
    if (progress > 0.5) score += 20;
    if (progress > 0.75) score += 15;
    
    // VIP/urgent orders
    if (kot.priority === 'URGENT') score += 50;
    if (kot.priority === 'HIGH') score += 30;
    
    // Table turnover (orders from tables that need clearing)
    if (kot.customer?.table && kot.customer.table !== 'counter') {
      score += 10;
    }

    // Convert score to priority
    if (score >= 70) return 'URGENT';
    if (score >= 50) return 'HIGH';
    if (score >= 30) return 'NORMAL';
    return 'LOW';
  };

  // Detect bottlenecks in kitchen stations
  const detectBottlenecks = () => {
    const stationLoads = {};
    
    kots.forEach(kot => {
      kot.items.forEach(item => {
        const station = routeItemToStation(item);
        if (!stationLoads[station]) {
          stationLoads[station] = { pending: 0, inProgress: 0, totalPrepTime: 0 };
        }
        
        if (item.status === 'PENDING') {
          stationLoads[station].pending++;
          stationLoads[station].totalPrepTime += calculatePrepTime(item);
        } else if (item.status === 'IN_PROGRESS' || item.status === 'PREPARING') {
          stationLoads[station].inProgress++;
        }
      });
    });

    const bottlenecks = [];
    Object.entries(stationLoads).forEach(([stationId, load]) => {
      const totalLoad = load.pending + load.inProgress;
      const avgPrepTime = load.totalPrepTime / (load.pending || 1);
      
      // Bottleneck criteria
      if (totalLoad > 10 || avgPrepTime > 20) {
        const station = kitchenStations.find(s => s.id === stationId);
        bottlenecks.push({
          stationId,
          stationName: station?.name || stationId,
          pending: load.pending,
          inProgress: load.inProgress,
          avgPrepTime,
          severity: totalLoad > 15 ? 'critical' : 'warning'
        });
      }
    });

    setBottlenecks(bottlenecks);
    
    // If load balancing is enabled, suggest redistributing items
    if (stationSettings.loadBalancing && bottlenecks.length > 0) {
      console.log('Load balancing suggestions:', bottlenecks);
    }
    
    return bottlenecks;
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    const completedKOTs = kots.filter(kot => kot.status === 'COMPLETED' || kot.status === 'SERVED');
    
    if (completedKOTs.length === 0) {
      setPerformanceMetrics(null);
      return;
    }

    const avgPrepTimes = {};
    const stationPerformance = {};
    const allDayCounts = {};

    completedKOTs.forEach(kot => {
      kot.items.forEach(item => {
        if (item.prepTime) {
          const station = routeItemToStation(item);
          if (!avgPrepTimes[station]) avgPrepTimes[station] = [];
          avgPrepTimes[station].push(item.prepTime);
        }
        
        // Track all day counts if enabled
        if (performanceSettings.allDayCounts) {
          const station = routeItemToStation(item);
          if (!allDayCounts[station]) {
            allDayCounts[station] = { completed: 0, totalQty: 0 };
          }
          allDayCounts[station].completed++;
          allDayCounts[station].totalQty += (item.quantity || 1);
        }
      });
    });

    Object.entries(avgPrepTimes).forEach(([stationId, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const station = kitchenStations.find(s => s.id === stationId);
      stationPerformance[station?.name || stationId] = {
        avgPrepTime: Math.round(avg),
        completedOrders: times.length
      };
    });

    setPerformanceMetrics(stationPerformance);
    
    if (performanceSettings.allDayCounts) {
      setAllDayCounts(allDayCounts);
    }
  };

  // Track preparation time for KOT
  const trackPrepTime = (kotId, itemId) => {
    const kot = kots.find(k => k.id === kotId);
    if (!kot) return;

    const now = Date.now();
    const item = kot.items.find(i => i.id === itemId);
    if (item) {
      if (!item.startTime) {
        item.startTime = now;
      } else if (!item.endTime) {
        item.endTime = now;
        item.prepTime = Math.round((item.endTime - item.startTime) / 1000 / 60); // in minutes
      }
    }
  };

  const speakItem = (itemOrKot, forceSpeak = false, mode = 'full') => {
    // If not forced, check if speech announcements are enabled
    if (!forceSpeak && !notificationSettings.speechAnnouncements) return;

    if (!speechManagerRef.current || !speechManagerRef.current.isReady()) {
      console.warn('Speech manager not ready');
      return;
    }

    try {
      let message;

      // Check if it's a KOT (order) or an individual item
      if (itemOrKot.items && Array.isArray(itemOrKot.items)) {
        // It's a KOT/order
        const items = itemOrKot.items.map(item => {
          let itemText = `${item.quantity} ${item.name}`;
          if (item.notes) {
            if (item.noteType === 'allergy') {
              itemText += `, allergic to ${item.notes}`;
            } else {
              itemText += ` with note: ${item.notes}`;
            }
          }
          return itemText;
        }).join(', ');

        if (mode === 'full') {
          // Full order info
          message = `Order ${itemOrKot.orderNumber || 'new'}. ${itemOrKot.customer?.name || 'Customer'} at ${itemOrKot.customer?.table || 'counter'}. Items: ${items}`;
        } else {
          // Items only
          message = items;
        }
      } else {
        // It's an individual item
        if (itemOrKot.notes) {
          if (itemOrKot.noteType === 'allergy') {
            message = `${itemOrKot.quantity || 1} ${itemOrKot.name || 'item'}, allergic to ${itemOrKot.notes}`;
          } else {
            message = `${itemOrKot.quantity || 1} ${itemOrKot.name || 'item'} with note: ${itemOrKot.notes}`;
          }
        } else {
          message = `${itemOrKot.quantity || 1} ${itemOrKot.name || 'item'}`;
        }
      }

      console.log('Speaking with SpeechManager:', message);

      speechManagerRef.current.speak(message, {
        rate: 1,
        pitch: 1,
        volume: 1
      });
    } catch (error) {
      console.error('Error in speakItem:', error);
    }
  };

  useEffect(() => {
    console.log('Initializing KitchenDisplaySystem');
    console.log('Settings:', settings);
    console.log('KOT Manager instance:', kotManager);
    
    loadKOTs();
    loadStatistics();

    // Subscribe to KOT events
    const handleKOTUpdate = () => {
      console.log('KOT update event received');
      loadKOTs(false); // Skip beeping on KOT updates
      loadStatistics();
      if (performanceSettings.bottleneckDetection) detectBottlenecks();
      if (performanceSettings.prepTimeTracking) calculatePerformanceMetrics();
      if (orderManagementSettings.previewTickets) loadPreviewTickets();
    };

    kotManager.on('kotCreated', handleKOTUpdate);
    kotManager.on('kotItemUpdated', handleKOTUpdate);
    kotManager.on('kotStatusUpdated', handleKOTUpdate);
    kotManager.on('kotPriorityUpdated', handleKOTUpdate);
    kotManager.on('kotCancelled', handleKOTUpdate);

    console.log('Subscribed to KOT events');

    // Auto refresh interval - always enable as fallback
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing KOTs (fallback)');
      loadKOTs(false); // Pass false to skip beeping on auto-refresh
      loadStatistics();
      if (performanceSettings.bottleneckDetection) detectBottlenecks();
      if (performanceSettings.prepTimeTracking) calculatePerformanceMetrics();
      if (orderManagementSettings.previewTickets) loadPreviewTickets();
    }, 3000); // Refresh every 3 seconds as fallback

    // Automated firing by prep time
    let firingInterval;
    if (orderManagementSettings.automatedFiring) {
      firingInterval = setInterval(() => {
        const allKOTs = kotManager.getAllKOTs();
        const now = Date.now();
        
        allKOTs.forEach(kot => {
          if (kot.status === 'PENDING' && kot.estimatedReadyAt) {
            const readyTime = new Date(kot.estimatedReadyAt).getTime();
            const fireDelay = (advancedSettings.fireDelayMinutes || 5) * 60 * 1000; // Default 5 minutes before ready time
            const fireTime = readyTime - fireDelay;
            
            if (now >= fireTime && now < readyTime) {
              // Auto-fire the order
              try {
                kotManager.updateKOTStatus(kot.kotId, 'PREPARING');
                console.log(`Auto-fired order ${kot.orderNumber} based on prep time`);
                
                // Announce if speech is enabled
                if (notificationSettings.speechAnnouncements) {
                  speakOrder(kot);
                }
              } catch (error) {
                console.error('Error auto-firing order:', error);
              }
            }
          }
        });
      }, 30000); // Check every 30 seconds
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Bump bar keyboard shortcuts
    const handleKeyDown = (e) => {
      if (!advancedSettings.bumpBarSupport) return;

      // Only trigger if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const allKOTs = kotManager.getAllKOTs();
      
      switch(e.key) {
        case 'F1':
          e.preventDefault();
          // Mark first pending order as preparing
          const firstPending = allKOTs.find(kot => kot.status === 'PENDING');
          if (firstPending) {
            kotManager.updateKOTStatus(firstPending.kotId, 'PREPARING');
            console.log('Bump bar: Started order', firstPending.orderNumber);
          }
          break;
        case 'F2':
          e.preventDefault();
          // Mark first preparing order as ready
          const firstPreparing = allKOTs.find(kot => kot.status === 'PREPARING');
          if (firstPreparing) {
            kotManager.updateKOTStatus(firstPreparing.kotId, 'READY');
            console.log('Bump bar: Marked order as ready', firstPreparing.orderNumber);
          }
          break;
        case 'F3':
          e.preventDefault();
          // Mark first ready order as served
          const firstReady = allKOTs.find(kot => kot.status === 'READY');
          if (firstReady) {
            kotManager.updateKOTStatus(firstReady.kotId, 'SERVED');
            console.log('Bump bar: Served order', firstReady.orderNumber);
          }
          break;
        case 'F4':
          e.preventDefault();
          // Refresh KOTs
          loadKOTs();
          loadStatistics();
          console.log('Bump bar: Refreshed KOTs');
          break;
        case 'F5':
          e.preventDefault();
          // Toggle sound alerts
          if (onSettingsChange) {
            onSettingsChange({
              ...settings,
              notificationSettings: {
                ...settings.notificationSettings,
                soundAlerts: !settings.notificationSettings.soundAlerts
              }
            });
            console.log('Bump bar: Toggled sound alerts');
          }
          break;
        case 'F6':
          e.preventDefault();
          // Toggle speech announcements
          if (onSettingsChange) {
            onSettingsChange({
              ...settings,
              notificationSettings: {
                ...settings.notificationSettings,
                speechAnnouncements: !settings.notificationSettings.speechAnnouncements
              }
            });
            console.log('Bump bar: Toggled speech announcements');
          }
          break;
        case 'F7':
          e.preventDefault();
          // Switch to next station
          const stations = ['all', KitchenStation.BAKERY, KitchenStation.KITCHEN, KitchenStation.BEVERAGE, KitchenStation.DESSERT, KitchenStation.GRILL, KitchenStation.FRYER, KitchenStation.COLD, KitchenStation.GENERAL];
          const currentIndex = stations.indexOf(selectedStation);
          const nextIndex = (currentIndex + 1) % stations.length;
          setSelectedStation(stations[nextIndex]);
          console.log('Bump bar: Switched to station', stations[nextIndex]);
          break;
        case 'F8':
          e.preventDefault();
          // Switch to previous station
          const stations2 = ['all', KitchenStation.BAKERY, KitchenStation.KITCHEN, KitchenStation.BEVERAGE, KitchenStation.DESSERT, KitchenStation.GRILL, KitchenStation.FRYER, KitchenStation.COLD, KitchenStation.GENERAL];
          const currentIndex2 = stations2.indexOf(selectedStation);
          const prevIndex = (currentIndex2 - 1 + stations2.length) % stations2.length;
          setSelectedStation(stations2[prevIndex]);
          console.log('Bump bar: Switched to station', stations2[prevIndex]);
          break;
        case 'F9':
          e.preventDefault();
          // Mark urgent
          const firstPendingUrgent = allKOTs.find(kot => kot.status === 'PENDING');
          if (firstPendingUrgent) {
            kotManager.updateKOTPriority(firstPendingUrgent.kotId, 'URGENT');
            console.log('Bump bar: Marked order as urgent', firstPendingUrgent.orderNumber);
          }
          break;
        case 'F10':
          e.preventDefault();
          // Cancel first pending order
          const firstPendingCancel = allKOTs.find(kot => kot.status === 'PENDING');
          if (firstPendingCancel) {
            kotManager.cancelKOT(firstPendingCancel.kotId);
            console.log('Bump bar: Cancelled order', firstPendingCancel.orderNumber);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Clean up event listeners
      kotManager.off('kotCreated', handleKOTUpdate);
      kotManager.off('kotItemUpdated', handleKOTUpdate);
      kotManager.off('kotStatusUpdated', handleKOTUpdate);
      kotManager.off('kotPriorityUpdated', handleKOTUpdate);
      kotManager.off('kotCancelled', handleKOTUpdate);
      
      // Clean up intervals
      clearInterval(refreshInterval);
      if (firingInterval) clearInterval(firingInterval);
      
      // Clean up speech manager
      if (speechManagerRef.current) {
        speechManagerRef.current.cancel();
      }

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [advancedSettings.autoRefresh, advancedSettings.refreshInterval, kotManager, notificationSettings.speechAnnouncements, notificationSettings.soundAlerts, selectedStation, advancedSettings.smartPriority, performanceSettings.bottleneckDetection, performanceSettings.prepTimeTracking, orderManagementSettings.automatedFiring, advancedSettings.fireDelayMinutes, advancedSettings.bumpBarSupport, onSettingsChange, settings]);

  // Station filter options
  const stations = [
    { id: 'all', name: 'All Stations', icon: '🍽️' },
    { id: KitchenStation.BAKERY, name: 'Bakery', icon: '🥐' },
    { id: KitchenStation.KITCHEN, name: 'Kitchen', icon: '🍳' },
    { id: KitchenStation.BEVERAGE, name: 'Beverage', icon: '☕' },
    { id: KitchenStation.DESSERT, name: 'Dessert', icon: '🍰' },
    { id: KitchenStation.GRILL, name: 'Grill', icon: '🥩' },
    { id: KitchenStation.FRYER, name: 'Fryer', icon: '🍟' },
    { id: KitchenStation.COLD, name: 'Cold', icon: '🥗' },
    { id: KitchenStation.GENERAL, name: 'General', icon: '🍽️' }
  ];

  const handleItemStatusChange = (kotId, kotItemId, newStatus) => {
    try {
      console.log('Updating item status:', kotId, kotItemId, newStatus);
      kotManager.updateItemStatus(kotId, kotItemId, newStatus);
      console.log('Item status updated, reloading KOTs');
      loadKOTs(); // Reload KOTs to show updated status
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleKOTStatusChange = (kotId, newStatus) => {
    try {
      kotManager.updateKOTStatus(kotId, newStatus);

      // Update status filter to match the new status
      setSelectedStatusFilter(newStatus);

      // Also update the main orders array to reflect the status change
      if (setOrders) {
        const kot = kotManager.getKOT(kotId);
        if (kot && kot.orderId) {
          setOrders(prevOrders => {
            const updatedOrders = prevOrders.map(order => {
              if (order.id === kot.orderId) {
                return { ...order, status: newStatus };
              }
              return order;
            });
            return updatedOrders;
          });
        }
      }
    } catch (error) {
      console.error('Error updating KOT status:', error);
    }
  };

  const handleMarkUrgent = (kotId) => {
    try {
      kotManager.markAsUrgent(kotId);
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

  const printRunnerTicket = (kot) => {
    if (!orderManagementSettings.runnerTicketPrinting) return;
    
    try {
      // Create a printable ticket format
      const ticketContent = `
================================
          RUNNER TICKET
================================
Order #: ${kot.orderNumber}
Token: ${kot.token || 'N/A'}
Table: ${kot.customer?.table || 'N/A'}
Customer: ${kot.customer?.name || 'Walk-in'}
Status: ${kot.status}
================================
ITEMS:
${kot.items?.map(item => {
  let itemText = `  ${item.quantity}x ${item.name} - ${item.status}`;
  if (item.isCustom) {
    itemText += ' (Custom)';
    if (item.baseItemName) {
      itemText += `\n    Base: ${item.baseItemName}`;
    }
  }
  if (item.notes) {
    const notePrefix = item.noteType === 'allergy' ? '⚠️ ALLERGY: ' : '📝 Note: ';
    itemText += `\n    ${notePrefix}${item.notes}`;
  }
  return itemText;
}).join('\n') || 'No items'}
================================
Notes: ${kot.notes || 'None'}
================================
Printed: ${new Date().toLocaleString()}
================================
      `;
      
      // Use browser print functionality
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Runner Ticket #${kot.orderNumber}</title>
            <style>
              body {
                font-family: monospace;
                font-size: 14px;
                white-space: pre-wrap;
                padding: 20px;
                max-width: 300px;
              }
            </style>
          </head>
          <body>${ticketContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
      console.log('Printed runner ticket for order', kot.orderNumber);
    } catch (error) {
      console.error('Error printing runner ticket:', error);
    }
  };

  const sendSMSAlert = (kot) => {
    if (!orderManagementSettings.smsAlerts || !kot.customer?.phone) return;
    
    try {
      // In a real implementation, this would call an SMS API
      // For now, we'll simulate it with a confirmation
      const message = `Your order #${kot.orderNumber} is ${kot.status.toLowerCase()}. ${kot.token ? `Token: ${kot.token}` : ''}`;
      
      console.log('SMS Alert sent to', kot.customer.phone, ':', message);
      
      // Show in-app notification
      if (notificationSettings.inAppAlerts) {
        alert(`SMS sent to ${kot.customer.phone}: ${message}`);
      }
    } catch (error) {
      console.error('Error sending SMS alert:', error);
    }
  };

  const sendInAppAlert = (kot, message) => {
    if (!notificationSettings.inAppAlerts) return;
    
    try {
      // Create an in-app notification
      const notification = new Notification(`Order #${kot.orderNumber}`, {
        body: message,
        icon: '🍳',
        tag: `kot-${kot.kotId}`
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      console.log('In-app alert sent for order', kot.orderNumber);
    } catch (error) {
      console.error('Error sending in-app alert:', error);
    }
  };

  const loadPreviewTickets = () => {
    if (!orderManagementSettings.previewTickets) return;
    
    try {
      // Get orders that are not yet fired to the kitchen
      const allKOTs = kotManager.getAllKOTs();
      const preview = allKOTs
        .filter(kot => kot.status === 'PENDING')
        .map(kot => ({
          ...kot,
          fireTime: calculateFireTime(kot, kot.items[0]) || 0,
          timeToFire: Math.max(0, Math.floor((new Date(kot.estimatedReadyAt).getTime() - Date.now()) / 60000))
        }))
        .filter(kot => kot.timeToFire > 0 && kot.timeToFire <= 30) // Show orders firing within 30 minutes
        .sort((a, b) => a.timeToFire - b.timeToFire)
        .slice(0, 10); // Show top 10 upcoming orders
      
      setPreviewTickets(preview);
    } catch (error) {
      console.error('Error loading preview tickets:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case KOTStatus.PENDING: return '#f59e0b';
      case KOTStatus.PREPARING: return '#3b82f6';
      case KOTStatus.READY: return '#10b981';
      case KOTStatus.SERVED: return '#6b7280';
      case KOTStatus.CANCELLED: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case KOTPriority.URGENT: return '#ef4444';
      case KOTPriority.HIGH: return '#f97316';
      case KOTPriority.NORMAL: return '#3b82f6';
      case KOTPriority.LOW: return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStationLabel = (station) => {
    const labels = {
      [KitchenStation.BAKERY]: 'Bakery',
      [KitchenStation.KITCHEN]: 'Kitchen',
      [KitchenStation.BEVERAGE]: 'Beverage',
      [KitchenStation.DESSERT]: 'Dessert',
      [KitchenStation.GRILL]: 'Grill',
      [KitchenStation.FRYER]: 'Fryer',
      [KitchenStation.COLD]: 'Cold',
      [KitchenStation.GENERAL]: 'General'
    };
    return labels[station] || station;
  };

  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace'
    }}>
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

        {/* Controls - Simplified */}
        <div style={{
          padding: screenSize === 'small' ? '12px 16px' : '16px 20px',
          background: '#000000',
          borderBottom: '1px solid #00ff00',
          display: 'flex',
          gap: screenSize === 'small' ? '12px' : '20px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          justifyContent: screenSize === 'small' ? 'flex-start' : 'space-between',
          flexDirection: screenSize === 'small' ? 'column' : 'row'
        }}>
          {/* Station Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>STATION:</span>
            <button
              onClick={() => setSelectedStation('all')}
              style={{
                padding: '6px 12px',
                background: selectedStation === 'all' ? '#00ff00' : '#000000',
                color: selectedStation === 'all' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedStation(KitchenStation.HOT)}
              style={{
                padding: '6px 12px',
                background: selectedStation === KitchenStation.HOT ? '#00ff00' : '#000000',
                color: selectedStation === KitchenStation.HOT ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              HOT
            </button>
            <button
              onClick={() => setSelectedStation(KitchenStation.COLD)}
              style={{
                padding: '6px 12px',
                background: selectedStation === KitchenStation.COLD ? '#00ff00' : '#000000',
                color: selectedStation === KitchenStation.COLD ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              COLD
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>STATUS:</span>
            <button
              onClick={() => setSelectedStatusFilter('all')}
              style={{
                padding: '6px 12px',
                background: selectedStatusFilter === 'all' ? '#00ff00' : '#000000',
                color: selectedStatusFilter === 'all' ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.PENDING)}
              style={{
                padding: '6px 12px',
                background: selectedStatusFilter === KOTStatus.PENDING ? '#ffff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.PENDING ? '#000000' : '#ffff00',
                border: '1px solid #ffff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              PENDING
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.PREPARING)}
              style={{
                padding: '6px 12px',
                background: selectedStatusFilter === KOTStatus.PREPARING ? '#00ff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.PREPARING ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              PREPARING
            </button>
            <button
              onClick={() => setSelectedStatusFilter(KOTStatus.READY)}
              style={{
                padding: '6px 12px',
                background: selectedStatusFilter === KOTStatus.READY ? '#00ff00' : '#000000',
                color: selectedStatusFilter === KOTStatus.READY ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              READY
            </button>
          </div>

          {/* Speech Toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#00ff00', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>SPEECH:</span>
            <button
              onClick={() => {
                const updated = { ...settings, notifications: { ...notificationSettings, speechAnnouncements: !notificationSettings.speechAnnouncements } };
                onSettingsChange?.(updated);
              }}
              style={{
                padding: '6px 12px',
                background: notificationSettings.speechAnnouncements ? '#00ff00' : '#000000',
                color: notificationSettings.speechAnnouncements ? '#000000' : '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              {notificationSettings.speechAnnouncements ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Quick Settings Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              style={{
                padding: '6px 12px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ SETTINGS ]
            </button>

            {/* Quick Settings Dropdown */}
            {showQuickSettings && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '4px',
                background: '#000000',
                border: '1px solid #00ff00',
                padding: '12px',
                minWidth: '280px',
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

      {/* KOT Grid */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '24px',
        background: '#000000',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Orders Display */}
        <div style={{
          display: displaySettings.ticketLayout === 'list' ? 'flex' : 'grid',
          flexDirection: displaySettings.ticketLayout === 'list' ? 'column' : undefined,
          gridTemplateColumns: displaySettings.ticketLayout === 'compact' 
            ? screenSize === 'small' ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))'
            : screenSize === 'small' ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: displaySettings.ticketLayout === 'compact' ? '8px' : screenSize === 'small' ? '12px' : '16px'
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
                onKOTStatusChange={handleKOTStatusChange}
                onMarkUrgent={handleMarkUrgent}
                onCancelKOT={handleCancelKOT}
                onItemStatusChange={handleItemStatusChange}
                onSpeakItem={speakItem}
                getStatusColor={getStatusColor}
                hasAllergyAlert={hasAllergyAlert}
                getItemCourse={getItemCourse}
                calculateFireTime={calculateFireTime}
                screenSize={screenSize}
                displaySettings={displaySettings}
                menuItems={menuItems}
                advancedSettings={advancedSettings}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// KOT Card Component
function KOTCard({ kot, screenSize, onItemStatusChange, onKOTStatusChange, onMarkUrgent, onCancelKOT, onSpeakItem, getStatusColor, hasAllergyAlert, getItemCourse, calculateFireTime, displaySettings, menuItems, advancedSettings }) {
  const [expanded, setExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const timeElapsed = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000);
  const orderAge = kot.orderAge || timeElapsed;
  const isOverdue = kot.estimatedReadyAt ? new Date() > new Date(kot.estimatedReadyAt) && kot.status !== KOTStatus.SERVED : false;

  // Format timestamp
  const formatTimestamp = (date) => {
    if (!date) return '--:--';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate duration
  const getDuration = (start, end) => {
    if (!start || !end) return '--';
    const diff = Math.floor((new Date(end) - new Date(start)) / 60000);
    return `${diff}m`;
  };

  // Condensed summary
  const getCondensedSummary = () => {
    if (!kot.items || kot.items.length === 0) return 'No items';
    const itemCount = kot.items.length;
    const totalQty = kot.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const completedCount = kot.items.filter(item => item.status === 'READY').length;
    return `${totalQty} items (${completedCount}/${itemCount} done)`;
  };

  // Countdown timer
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
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [kot.estimatedReadyAt]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStationIcon = (station) => {
    const icons = {
      [KitchenStation.BAKERY]: '🥐',
      [KitchenStation.KITCHEN]: '🍳',
      [KitchenStation.BEVERAGE]: '☕',
      [KitchenStation.DESSERT]: '🍰',
      [KitchenStation.GRILL]: '🥩',
      [KitchenStation.FRYER]: '🍟',
      [KitchenStation.COLD]: '🥗',
      [KitchenStation.GENERAL]: '🍽️'
    };
    return icons[station] || '🍽️';
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '0px',
      border: '2px solid #000000',
      overflow: 'hidden',
      boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: '"Courier New", monospace',
      transform: `scale(${(displaySettings.ticketZoom || 100) / 100})`,
      transformOrigin: 'top left'
    }}
    onMouseEnter={(e) => {
      e.target.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.target.style.boxShadow = '2px 2px 0px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Card Header */}
      <div style={{
        padding: screenSize === 'small' ? '12px' : '16px',
        background: '#ffffff',
        borderBottom: '2px dashed #000000',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: screenSize === 'small' ? '60px' : '70px'
      }}
      onClick={() => setExpanded(!expanded)}
      >
        {/* Status Badge */}
        <div style={{
          position: 'absolute',
          top: screenSize === 'small' ? '12px' : '16px',
          right: screenSize === 'small' ? '12px' : '16px',
          padding: screenSize === 'small' ? '4px 8px' : '6px 12px',
          background: isOverdue ? '#ff0000' : kot.status === KOTStatus.READY ? '#00ff00' : kot.status === KOTStatus.PREPARING ? '#0000ff' : kot.status === KOTStatus.PENDING ? '#ffaa00' : '#808080',
          color: kot.status === KOTStatus.PENDING ? '#000000' : '#ffffff',
          borderRadius: '0px',
          fontSize: screenSize === 'small' ? '11px' : '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          border: '1px solid #000000',
          zIndex: 10
        }}>
          {kot.status}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: screenSize === 'small' ? 'flex-start' : 'flex-start', marginBottom: screenSize === 'small' ? '8px' : '12px', flexDirection: screenSize === 'small' ? 'column' : 'row', gap: screenSize === 'small' ? '8px' : '0', paddingRight: screenSize === 'small' ? '80px' : '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: screenSize === 'small' ? '18px' : '24px', 
              fontWeight: 'bold', 
              color: '#000000',
              fontFamily: '"Courier New", monospace'
            }}>#{kot.orderNumber}</span>
            {kot.token && (
              <span style={{
                padding: screenSize === 'small' ? '4px 8px' : '6px 10px',
                background: '#000000',
                color: '#ffffff',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                border: '1px solid #000000',
                fontFamily: '"Courier New", monospace'
              }}>
                {kot.token}
              </span>
            )}
            {kot.station && (
              <span style={{
                padding: screenSize === 'small' ? '4px 8px' : '6px 10px',
                background: '#000000',
                color: '#ffffff',
                borderRadius: '0px',
                fontSize: screenSize === 'small' ? '11px' : '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid #000000',
                fontFamily: '"Courier New", monospace'
              }}>
                {kot.station}
              </span>
            )}
          </div>
          
          {/* Countdown Timer */}
          <div style={{
            padding: screenSize === 'small' ? '4px 8px' : '6px 10px',
            background: isOverdue ? '#ff0000' : timeLeft < 300 ? '#ffff00' : '#00ff00',
            color: '#000000',
            borderRadius: '0px',
            fontSize: screenSize === 'small' ? '12px' : '14px',
            fontWeight: 'bold',
            fontFamily: '"Courier New", monospace',
            border: '1px solid #000000',
            whiteSpace: 'nowrap'
          }}>
            {isOverdue ? 'OVERDUE' : formatTime(timeLeft)}
          </div>
        </div>

        {/* Order Meta Info */}
        <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#000000', flexWrap: 'wrap', fontFamily: '"Courier New", monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Customer:</span>
            <span>{kot.customer?.name || 'Walk-in'}</span>
          </div>
          {kot.customer?.table && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Table:</span>
              <span>{kot.customer.table}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Age:</span>
            <span style={{ fontWeight: 'bold' }}>{orderAge}m</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: screenSize === 'small' ? '16px' : '24px', background: '#ffffff' }}>
          {/* Items List */}
          <div style={{ marginBottom: screenSize === 'small' ? '16px' : '20px' }}>
            <div style={{
              fontSize: screenSize === 'small' ? '11px' : '12px',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: screenSize === 'small' ? '10px' : '12px',
              fontFamily: '"Courier New", monospace',
              borderBottom: '1px solid #000000',
              paddingBottom: '8px'
            }}>
              ORDER ITEMS ({kot.items?.length || 0})
            </div>
            {kot.items?.map((item, index) => (
              <div key={item.kotItemId || index} style={{
                padding: '8px 0',
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
                          if (recipe && recipe.recipe) {
                            alert(`RECIPE: ${item.name}\n\n${recipe.recipe}`);
                          } else {
                            alert(`No recipe available for ${item.name}`);
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
                <div style={{
                  padding: '4px 8px',
                  background: item.status === 'READY' ? '#00ff00' : item.status === 'PREPARING' ? '#ffff00' : '#808080',
                  color: '#000000',
                  border: '1px solid #000000',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '0px'
                }}>
                  {item.status}
                </div>
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSpeakItem && onSpeakItem(kot, true, 'full')}
              style={{
                padding: '8px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ SPEAK FULL ]
            </button>
            <button
              onClick={() => onSpeakItem && onSpeakItem(kot, true, 'items')}
              style={{
                padding: '8px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ SPEAK ITEMS ]
            </button>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.PREPARING)}
              style={{
                padding: '8px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ START ]
            </button>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.READY)}
              style={{
                padding: '8px 16px',
                background: '#00ff00',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ READY ]
            </button>
            <button
              onClick={() => onMarkUrgent(kot.kotId)}
              style={{
                padding: '8px 16px',
                background: '#ff0000',
                color: '#ffffff',
                border: '1px solid #000000',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ URGENT ]
            </button>
            <button
              onClick={() => onCancelKOT(kot.kotId)}
              style={{
                padding: '8px 16px',
                background: '#000000',
                color: '#ff0000',
                border: '1px solid #ff0000',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
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
