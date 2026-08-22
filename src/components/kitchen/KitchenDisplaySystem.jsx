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

    return suggestions.sort((a, b) => b.count - a.count);
  };

  // Calculate fire time for course-based serving
  const calculateFireTime = (kot, item) => {
    const course = getItemCourse(item);
    const courseDef = courses.find(c => c.id === course);
    const orderAge = getOrderAge(kot.createdAt);
    const delay = courseDef?.delay || 0;
    
    // Fire when order age reaches delay threshold
    return Math.max(0, delay - orderAge);
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

  const loadKOTs = () => {
    // Get all KOTs without filtering
    try {
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
        
        console.log('Final filtered KOTs:', filteredKOTs.length);
        console.log('Filtered KOTs data:', filteredKOTs);
        
        setKots(filteredKOTs);
        
        // Check for new orders and speak them
        if (updatedKOTs.length > lastKOTCount) {
          const newKOTs = updatedKOTs.slice(lastKOTCount);
          console.log('New KOTs detected:', newKOTs);
          
          // Only beep for new orders - speech is manual only
          if (notificationSettings.soundAlerts && newKOTs.length > 0) {
            console.log('Sound enabled, playing beep for new orders');
            playAlertSound();
          } else {
            console.log('Sound disabled or no new KOTs');
          }
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
        } else if (item.status === 'IN_PROGRESS') {
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
    return bottlenecks;
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    const completedKOTs = kots.filter(kot => kot.status === 'COMPLETED');
    
    if (completedKOTs.length === 0) {
      setPerformanceMetrics(null);
      return;
    }

    const avgPrepTimes = {};
    const stationPerformance = {};

    completedKOTs.forEach(kot => {
      kot.items.forEach(item => {
        if (item.prepTime) {
          const station = routeItemToStation(item);
          if (!avgPrepTimes[station]) avgPrepTimes[station] = [];
          avgPrepTimes[station].push(item.prepTime);
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

  const speakItem = (item) => {
    if (!notificationSettings.speechAnnouncements) return;
    
    if (!speechManagerRef.current || !speechManagerRef.current.isReady()) {
      console.warn('Speech manager not ready');
      return;
    }
    
    try {
      const message = `${item.quantity} ${item.name} ${item.notes ? 'with ' + item.notes : ''}`;
      console.log('Speaking item with SpeechManager:', message);
      
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
      loadKOTs();
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
      loadKOTs();
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
      background: displaySettings.darkMode ? '#0f172a' : '#ffffff',
      minHeight: '100vh',
      color: displaySettings.darkMode ? '#f1f5f9' : '#111827',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
        padding: '24px 32px',
        borderBottom: displaySettings.darkMode ? '2px solid #334155' : '2px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827', letterSpacing: '-0.5px' }}>
            🍳 Kitchen Display System
          </h1>
          <p style={{ margin: '6px 0 0 0', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', fontSize: '14px', fontWeight: '400' }}>
            Real-time order management
          </p>
        </div>
        
        {/* Statistics */}
        {statistics && (
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: displaySettings.darkMode ? '#334155' : '#f3f4f6', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                {statistics.active}
              </div>
              <div style={{ fontSize: '12px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: displaySettings.darkMode ? '#334155' : '#f3f4f6', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                {statistics.byStatus.pending}
              </div>
              <div style={{ fontSize: '12px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: displaySettings.darkMode ? '#334155' : '#f3f4f6', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                {statistics.overdue}
              </div>
              <div style={{ fontSize: '12px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Overdue</div>
            </div>
          </div>
        )}
      </div>

        {/* Controls */}
        <div style={{
          padding: '16px 20px',
          background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
          borderBottom: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {orderManagementSettings.previewTickets && (
              <button
                onClick={() => {
                  loadPreviewTickets();
                  setShowPreviewPanel(true);
                }}
                style={{
                  padding: '10px 16px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#d97706'}
                onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
              >
                🔥 Preview Tickets
              </button>
            )}
          </div>

          {/* Station Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', fontWeight: '600', marginRight: '8px' }}>STATION:</span>
            {displaySettings.expoMode && (
              <button
                onClick={() => setSelectedStation('all')}
                style={{
                  padding: '10px 16px',
                  background: selectedStation === 'all' ? '#8b5cf6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                  color: selectedStation === 'all' ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                  border: selectedStation === 'all' ? '2px solid #a78bfa' : '2px solid transparent',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                🌐 Expo Mode (All)
              </button>
            )}
          {stations.map(station => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              style={{
                padding: '10px 16px',
                background: selectedStation === station.id ? '#3b82f6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                color: selectedStation === station.id ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                border: selectedStation === station.id ? '2px solid #60a5fa' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onMouseEnter={(e) => {
                if (selectedStation !== station.id) {
                  e.target.style.background = displaySettings.darkMode ? '#334155' : '#e5e7eb';
                  e.target.style.color = displaySettings.darkMode ? '#f1f5f9' : '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStation !== station.id) {
                  e.target.style.background = displaySettings.darkMode ? '#1e293b' : '#f3f4f6';
                  e.target.style.color = displaySettings.darkMode ? '#94a3b8' : '#6b7280';
                }
              }}
            >
              {station.icon} {station.name}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        {orderManagementSettings.timestamps && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', fontWeight: '600', marginRight: '8px' }}>STATUS:</span>
            {[
              { id: 'all', name: 'All', color: '#6b7280' },
              { id: 'PENDING', name: 'New', color: '#9ca3af' },
              { id: 'PREPARING', name: 'Preparing', color: '#f59e0b' },
              { id: 'READY', name: 'Done', color: '#10b981' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setSelectedStatusFilter(status.id)}
                style={{
                  padding: '8px 14px',
                  background: selectedStatusFilter === status.id ? status.color : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                  color: selectedStatusFilter === status.id ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                  border: selectedStatusFilter === status.id ? '2px solid transparent' : '2px solid transparent',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {status.name}
              </button>
            ))}
          </div>
        )}

        {/* Order Type Filter */}
        {orderManagementSettings.orderChannelConsolidation && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', fontWeight: '600', marginRight: '8px' }}>TYPE:</span>
            {[
              { id: 'all', name: 'All' },
              { id: 'dine-in', name: 'Dine-In' },
              { id: 'delivery', name: 'Delivery' },
              { id: 'pickup', name: 'Pickup' },
              { id: 'qr', name: 'QR Order' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedOrderTypeFilter(type.id)}
                style={{
                  padding: '8px 14px',
                  background: selectedOrderTypeFilter === type.id ? '#8b5cf6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                  color: selectedOrderTypeFilter === type.id ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                  border: selectedOrderTypeFilter === type.id ? '2px solid #a78bfa' : '2px solid transparent',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
        )}

        {/* Quick Action Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowStationSettings(!showStationSettings)}
            style={{
              padding: '10px 16px',
              background: showStationSettings ? '#10b981' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
              color: showStationSettings ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
              border: showStationSettings ? '2px solid #34d399' : '2px solid transparent',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🏭 Stations
          </button>
          <button
            onClick={() => setShowPrinterSettings(!showPrinterSettings)}
            style={{
              padding: '10px 16px',
              background: showPrinterSettings ? '#f59e0b' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
              color: showPrinterSettings ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
              border: showPrinterSettings ? '2px solid #fbbf24' : '2px solid transparent',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖨️ Printers
          </button>
          <button
            onClick={() => {
              // Toggle sound via settings
              const updated = { ...settings, notifications: { ...notificationSettings, soundAlerts: !notificationSettings.soundAlerts } };
              onSettingsChange?.(updated);
            }}
            style={{
              padding: '10px 16px',
              background: notificationSettings.soundAlerts ? '#10b981' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
              color: notificationSettings.soundAlerts ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
              border: notificationSettings.soundAlerts ? '2px solid #34d399' : '2px solid transparent',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {notificationSettings.soundAlerts ? '🔊' : '🔇'} Sound
          </button>
          <button
            onClick={() => {
              const updated = { ...settings, notifications: { ...notificationSettings, speechAnnouncements: !notificationSettings.speechAnnouncements } };
              onSettingsChange?.(updated);
            }}
            style={{
              padding: '10px 16px',
              background: notificationSettings.speechAnnouncements ? '#8b5cf6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
              color: notificationSettings.speechAnnouncements ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
              border: notificationSettings.speechAnnouncements ? '2px solid #a78bfa' : '2px solid transparent',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {notificationSettings.speechAnnouncements ? '🎤' : '🔇'} Speech
          </button>
          {performanceSettings.performanceMetrics && (
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{
                padding: '10px 16px',
                background: showAnalytics ? '#3b82f6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                color: showAnalytics ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                border: showAnalytics ? '2px solid #60a5fa' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              � Analytics
            </button>
          )}
          {orderManagementSettings.courseBasedSeparation && (
            <button
              onClick={() => setShowCourseView(!showCourseView)}
              style={{
                padding: '10px 16px',
                background: showCourseView ? '#f59e0b' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                color: showCourseView ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                border: showCourseView ? '2px solid #fbbf24' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              🍽️ {showCourseView ? 'All' : 'Courses'}
            </button>
          )}
          {advancedSettings.viewingRecipes && (
            <button
              onClick={() => setShowRecipePanel(!showRecipePanel)}
              style={{
                padding: '10px 16px',
                background: showRecipePanel ? '#ec4899' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                color: showRecipePanel ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                border: showRecipePanel ? '2px solid #f472b6' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              📖 {showRecipePanel ? 'Hide' : 'Recipes'}
            </button>
          )}
        </div>

        {/* Offline Indicator */}
        {!isOnline && advancedSettings.offlineMode && (
          <div style={{
            padding: '8px 16px',
            background: '#f59e0b',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⚠️ Offline Mode
          </div>
        )}
      </div>

      {/* KOT Grid */}
      <div style={{ 
        padding: '24px',
        background: displaySettings.darkMode ? '#0f172a' : '#f9fafb',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Batch Preparation Suggestions */}
        {advancedSettings.smartPriority && (
          <div style={{
            background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            border: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827', marginBottom: '16px' }}>
              🔄 Batch Preparation Suggestions
            </div>
            {(() => {
              const suggestions = getBatchSuggestions();
              if (suggestions.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                    No batch opportunities detected
                  </div>
                );
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {suggestions.map((suggestion, index) => (
                    <div key={index} style={{
                      background: '#0f172a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      borderLeft: `4px solid ${kitchenStations.find(s => s.id === suggestion.station)?.color || '#3b82f6'}`
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
                        {suggestion.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                        {suggestion.category}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                        {suggestion.count}x
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Course View Panel */}
        {showCourseView && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: 1000,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            border: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827', margin: 0 }}>Course View</h3>
              <button
                onClick={() => setShowCourseView(false)}
                style={{
                  padding: '8px 12px',
                  background: displaySettings.darkMode ? '#334155' : '#e5e7eb',
                  color: displaySettings.darkMode ? '#94a3b8' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['all', 'appetizer', 'main', 'dessert', 'beverage'].map(course => (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  style={{
                    padding: '8px 16px',
                    background: selectedCourse === course ? '#3b82f6' : (displaySettings.darkMode ? '#1e293b' : '#f3f4f6'),
                    color: selectedCourse === course ? '#ffffff' : (displaySettings.darkMode ? '#94a3b8' : '#6b7280'),
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {course}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280' }}>
              Showing items for: <strong>{selectedCourse}</strong>
            </div>
          </div>
        )}

        {/* Preview Tickets Panel */}
        {showPreviewPanel && orderManagementSettings.previewTickets && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: 1000,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            border: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            minWidth: '400px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827', margin: 0 }}>Preview Tickets (Fire on Next)</h3>
              <button
                onClick={() => setShowPreviewPanel(false)}
                style={{
                  padding: '8px 12px',
                  background: displaySettings.darkMode ? '#334155' : '#e5e7eb',
                  color: displaySettings.darkMode ? '#94a3b8' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {previewTickets.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: displaySettings.darkMode ? '#94a3b8' : '#6b7280',
                fontSize: '14px'
              }}>
                No upcoming orders to fire
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewTickets.map(kot => (
                  <div key={kot.kotId} style={{
                    padding: '16px',
                    background: displaySettings.darkMode ? '#334155' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${kot.timeToFire <= 5 ? '#ef4444' : (displaySettings.darkMode ? '#475569' : '#e5e7eb')}`,
                    borderLeft: `4px solid ${kot.timeToFire <= 5 ? '#ef4444' : '#f59e0b'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827' }}>
                        #{kot.orderNumber}
                      </span>
                      <span style={{ 
                        padding: '4px 8px',
                        background: kot.timeToFire <= 5 ? '#ef4444' : '#f59e0b',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        Fire in {kot.timeToFire}m
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', marginBottom: '8px' }}>
                      {kot.items?.slice(0, 3).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      {kot.items?.length > 3 && ` +${kot.items.length - 3} more`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          kotManager.updateKOTStatus(kot.kotId, 'PREPARING');
                          loadPreviewTickets();
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Fire Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe Panel */}
        {showRecipePanel && (
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #334155',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '20px' }}>
              👨‍🍳 Recipe Reference
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {Object.entries(recipes).map(([category, recipe]) => (
                <div key={category} style={{
                  background: '#0f172a',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>{category}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Prep: {recipe.prepTime}min • Cook: {recipe.cookTime}min
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: '1.6' }}>
                    {recipe.instructions.map((step, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>
                        {i + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Analytics Panel */}
        {showAnalytics && (
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '20px' }}>
              📊 Kitchen Analytics
            </div>

            {/* Bottlenecks */}
            {bottlenecks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
                  ⚠️ Detected Bottlenecks
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {bottlenecks.map(bottleneck => (
                    <div key={bottleneck.stationId} style={{
                      background: bottleneck.severity === 'critical' ? '#7f1d1d' : '#78350f',
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${bottleneck.severity === 'critical' ? '#dc2626' : '#f59e0b'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                          {bottleneck.stationName}
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: bottleneck.severity === 'critical' ? '#dc2626' : '#f59e0b',
                          color: '#ffffff'
                        }}>
                          {bottleneck.severity.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#e0e0e0' }}>
                        Pending: {bottleneck.pending} • In Progress: {bottleneck.inProgress} • Avg Prep Time: {Math.round(bottleneck.avgPrepTime)} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {performanceMetrics && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
                  📈 Station Performance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {Object.entries(performanceMetrics).map(([station, metrics]) => (
                    <div key={station} style={{
                      background: '#0f172a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                        {station}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                        Avg Prep Time: <span style={{ color: '#10b981', fontWeight: '600' }}>{metrics.avgPrepTime} min</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Completed: <span style={{ color: '#3b82f6', fontWeight: '600' }}>{metrics.completedOrders}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bottlenecks.length === 0 && !performanceMetrics && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '14px' }}>No analytics data available yet</div>
              </div>
            )}
          </div>
        )}

        {kots.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '120px 40px',
            color: '#64748b',
            background: '#1e293b',
            borderRadius: '16px',
            border: '2px dashed #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ fontSize: '72px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>No Orders Yet</div>
            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px' }}>
              Orders will appear here when they're created. Select a station to filter orders.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px'
            }}>
              {kots
                .filter(kot => {
                  if (!showCourseView || selectedCourse === 'all') return true;
                  return kot.items.some(item => getItemCourse(item) === selectedCourse);
                })
                .map(kot => ({
                  ...kot,
                  smartPriority: advancedSettings.smartPriority ? calculateSmartPriority(kot) : kot.priority,
                  orderAge: getOrderAge(kot.createdAt)
                }))
                .sort((a, b) => {
                  const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
                  const priorityA = priorityOrder[a.smartPriority] || 2;
                  const priorityB = priorityOrder[b.smartPriority] || 2;
                  if (priorityA !== priorityB) return priorityA - priorityB;
                  return b.orderAge - a.orderAge; // Sort by age (oldest first)
                })
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(kot => (
                  <KOTCard
                    key={kot.kotId}
                    kot={kot}
                    onItemStatusChange={handleItemStatusChange}
                    onKOTStatusChange={handleKOTStatusChange}
                    onMarkUrgent={handleMarkUrgent}
                    onCancelKOT={handleCancelKOT}
                    onSpeakOrder={speakOrder}
                    onSpeakItem={speakItem}
                    onPrintRunnerTicket={printRunnerTicket}
                    onSendSMSAlert={sendSMSAlert}
                    onSendInAppAlert={sendInAppAlert}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    speechEnabled={notificationSettings.speechAnnouncements}
                    smartPriorityEnabled={advancedSettings.smartPriority}
                    getItemCourse={getItemCourse}
                    hasAllergyAlert={hasAllergyAlert}
                    getAgingColor={getAgingColor}
                    calculateFireTime={calculateFireTime}
                    showCourseView={showCourseView}
                    displaySettings={displaySettings}
                    orderManagementSettings={orderManagementSettings}
                    notificationSettings={notificationSettings}
                  />
                ))}
            </div>

            {/* Pagination Controls */}
            {orderManagementSettings.pagination && kots.length > itemsPerPage && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '24px',
                padding: '16px',
                background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
                borderRadius: '12px',
                border: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 ? (displaySettings.darkMode ? '#334155' : '#e5e7eb') : '#3b82f6',
                    color: currentPage === 1 ? (displaySettings.darkMode ? '#64748b' : '#9ca3af') : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>

                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: displaySettings.darkMode ? '#f8fafc' : '#111827'
                }}>
                  Page {currentPage} of {Math.ceil(kots.length / itemsPerPage)}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(kots.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(kots.length / itemsPerPage)}
                  style={{
                    padding: '8px 16px',
                    background: currentPage >= Math.ceil(kots.length / itemsPerPage) ? (displaySettings.darkMode ? '#334155' : '#e5e7eb') : '#3b82f6',
                    color: currentPage >= Math.ceil(kots.length / itemsPerPage) ? (displaySettings.darkMode ? '#64748b' : '#9ca3af') : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: currentPage >= Math.ceil(kots.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= Math.ceil(kots.length / itemsPerPage) ? 0.5 : 1
                  }}
                >
                  Next →
                </button>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: displaySettings.darkMode ? '#334155' : '#f3f4f6',
                    color: displaySettings.darkMode ? '#f8fafc' : '#111827',
                    border: displaySettings.darkMode ? '1px solid #475569' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Station Settings Modal */}
      {showStationSettings && (
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
          background: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              🏭 Kitchen Stations
            </h3>
            <button
              onClick={() => setShowStationSettings(false)}
              style={{
                padding: '8px 12px',
                background: '#334155',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {kitchenStations.map(station => (
              <div key={station.id} style={{
                background: '#0f172a',
                borderRadius: '12px',
                padding: '16px',
                border: `2px solid ${station.color}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>{station.name}</div>
                  <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    background: station.color,
                    color: '#ffffff'
                  }}>
                    {station.categories.length} categories
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Categories:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {station.categories.map(cat => (
                      <span key={cat} style={{
                        padding: '4px 10px',
                        background: '#334155',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#e0e0e0'
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Printer: {printers.find(p => p.id === station.printer)?.name || 'Not assigned'}
                  </div>
                  <button style={{
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}

            <button style={{
              padding: '12px 24px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              + Add Station
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Printer Settings Modal */}
      {showPrinterSettings && (
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
          background: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              🖨️ Printer Configuration
            </h3>
            <button
              onClick={() => setShowPrinterSettings(false)}
              style={{
                padding: '8px 12px',
                background: '#334155',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {printers.map(printer => (
              <div key={printer.id} style={{
                background: '#0f172a',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>{printer.name}</div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: printer.status === 'online' ? '#10b981' : '#ef4444',
                    color: '#ffffff'
                  }}>
                    {printer.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Type: {printer.type}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Test Print
                    </button>
                    <button style={{
                      padding: '6px 12px',
                      background: '#334155',
                      color: '#e0e0e0',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button style={{
              padding: '12px 24px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              + Add Printer
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// KOT Card Component
function KOTCard({ kot, onItemStatusChange, onKOTStatusChange, onMarkUrgent, onCancelKOT, onSpeakOrder, onSpeakItem, onPrintRunnerTicket, onSendSMSAlert, onSendInAppAlert, getStatusColor, getPriorityColor, speechEnabled, smartPriorityEnabled, getItemCourse, hasAllergyAlert, getAgingColor, calculateFireTime, showCourseView, displaySettings, orderManagementSettings, notificationSettings }) {
  const [expanded, setExpanded] = useState(!orderManagementSettings.condensedView);
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
      background: displaySettings.darkMode ? '#1e293b' : '#ffffff',
      borderRadius: '12px',
      border: `2px solid ${isOverdue ? '#ef4444' : kot.priority === KOTPriority.URGENT ? '#ef4444' : (displaySettings.darkMode ? '#334155' : '#e5e7eb')}`,
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-4px)';
      e.target.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.4), 0 4px 8px -1px rgba(0, 0, 0, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)';
    }}
    >
      {/* Card Header */}
      <div style={{
        padding: '16px 20px',
        background: isOverdue ? '#7f1d1d' : kot.priority === KOTPriority.URGENT ? '#7f1d1d' : (displaySettings.darkMode ? '#334155' : '#f3f4f6'),
        borderBottom: displaySettings.darkMode ? '1px solid #475569' : '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        borderLeft: `4px solid ${getAgingColor(orderAge)}`
      }}
      onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827', letterSpacing: '-0.5px' }}>#{kot.orderNumber}</span>
            {kot.token && (
              <span style={{
                padding: '4px 12px',
                background: '#3b82f6',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}>
                {kot.token}
              </span>
            )}
            {kot.station && (
              <span style={{
                padding: '4px 12px',
                background: '#64748b',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {getStationIcon(kot.station)} {kot.station}
              </span>
            )}
            <span style={{
              padding: '4px 12px',
              background: kot.priority === KOTPriority.URGENT ? '#ef4444' : '#64748b',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {smartPriorityEnabled && kot.smartPriority ? kot.smartPriority : kot.priority}
            </span>
            {/* Order Age Badge */}
            <span style={{
              padding: '4px 12px',
              background: getAgingColor(orderAge),
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⏱️ {orderAge}m
            </span>
            {/* Payment Status */}
            {orderManagementSettings.paymentStatus && kot.paymentStatus && (
              <span style={{
                padding: '4px 12px',
                background: kot.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
              {kot.paymentStatus === 'PAID' ? '💳 Paid' : '💳 Unpaid'}
              </span>
            )}
          </div>
          
          {/* Countdown Timer */}
          <div style={{
            padding: '6px 14px',
            background: isOverdue ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : '#10b981',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '700',
            fontFamily: 'monospace',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {isOverdue ? '⚠️ OVERDUE' : formatTime(timeLeft)}
          </div>
        </div>

        {/* Customer & Table Info */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: displaySettings.darkMode ? '#cbd5e1' : '#6b7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>👤</span>
            <span>{kot.customer?.name || 'Walk-in'}</span>
          </div>
          {kot.customer?.table && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>🪑</span>
              <span>{kot.customer.table}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>⏱️</span>
            <span>{timeElapsed}m ago</span>
          </div>
          {/* Timestamps */}
          {orderManagementSettings.timestamps && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>📥</span>
                <span>{formatTimestamp(kot.createdAt)}</span>
              </div>
              {kot.startedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>👨‍🍳</span>
                  <span>{formatTimestamp(kot.startedAt)}</span>
                </div>
              )}
              {kot.completedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: displaySettings.darkMode ? '#94a3b8' : '#9ca3af' }}>✅</span>
                  <span>{formatTimestamp(kot.completedAt)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: '16px 20px', background: displaySettings.darkMode ? '#1e293b' : '#f9fafb' }}>
          {/* Items List */}
          <div style={{ marginBottom: '16px' }}>
            {kot.items?.map((item, index) => (
              <KOTItem
                key={item.kotItemId || index}
                item={item}
                onStatusChange={(status) => onItemStatusChange(kot.kotId, item.kotItemId, status)}
                onSpeak={() => onSpeakItem(item)}
                getStatusColor={getStatusColor}
                speechEnabled={speechEnabled}
                hasAllergyAlert={hasAllergyAlert}
                getItemCourse={getItemCourse}
                calculateFireTime={calculateFireTime}
                showCourseView={showCourseView}
                orderAge={orderAge}
                displaySettings={displaySettings}
              />
            ))}
          </div>

          {/* Notes */}
          {kot.notes && (
            <div style={{
              padding: '12px',
              background: displaySettings.darkMode ? '#334155' : '#fef3c7',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: displaySettings.darkMode ? '#cbd5e1' : '#92400e',
              borderLeft: '3px solid #f59e0b'
            }}>
              <div style={{ fontSize: '11px', color: displaySettings.darkMode ? '#94a3b8' : '#b45309', marginBottom: '4px', fontWeight: '600' }}>NOTES</div>
              {kot.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.PREPARING)}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
            >
              ▶️ Start
            </button>
            <button
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.READY)}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              ✅ Ready
            </button>
            <button
              onClick={() => onMarkUrgent(kot.kotId)}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#d97706'}
              onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
            >
              ⚡ Urgent
            </button>
            <button
              onClick={() => onCancelKOT(kot.kotId)}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              ❌ Cancel
            </button>
            {orderManagementSettings.runnerTicketPrinting && onPrintRunnerTicket && (
              <button
                onClick={() => onPrintRunnerTicket(kot)}
                style={{
                  padding: '8px 16px',
                  background: '#06b6d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#0891b2'}
                onMouseLeave={(e) => e.target.style.background = '#06b6d4'}
              >
                🖨️ Print Runner
              </button>
            )}
            {orderManagementSettings.smsAlerts && onSendSMSAlert && (
              <button
                onClick={() => onSendSMSAlert(kot)}
                style={{
                  padding: '8px 16px',
                  background: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#7c3aed'}
                onMouseLeave={(e) => e.target.style.background = '#8b5cf6'}
              >
                📱 SMS Alert
              </button>
            )}
            {notificationSettings.inAppAlerts && onSendInAppAlert && (
              <button
                onClick={() => onSendInAppAlert(kot, `Order #${kot.orderNumber} is ${kot.status}`)}
                style={{
                  padding: '8px 16px',
                  background: '#ec4899',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#db2777'}
                onMouseLeave={(e) => e.target.style.background = '#ec4899'}
              >
                🔔 In-App Alert
              </button>
            )}
          </div>
        </div>
      )}

      {/* Condensed Summary (when not expanded) */}
      {!expanded && orderManagementSettings.condensedView && (
        <div style={{ 
          padding: '12px 20px', 
          background: displaySettings.darkMode ? '#1e293b' : '#f9fafb',
          borderTop: displaySettings.darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          fontSize: '13px',
          color: displaySettings.darkMode ? '#94a3b8' : '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{getCondensedSummary()}</span>
          <span style={{ fontSize: '11px', color: displaySettings.darkMode ? '#64748b' : '#9ca3af' }}>
            Click to expand
          </span>
        </div>
      )}
    </div>
  );
}

// KOT Item Component
function KOTItem({ item, onStatusChange, onSpeak, getStatusColor, speechEnabled, hasAllergyAlert, getItemCourse, calculateFireTime, showCourseView, orderAge, displaySettings }) {
  const course = getItemCourse ? getItemCourse(item) : 'main';
  const fireTime = calculateFireTime ? calculateFireTime({ createdAt: Date.now() - orderAge * 60000 }, item) : 0;
  const allergyAlert = hasAllergyAlert ? hasAllergyAlert(item) : false;

  return (
    <div style={{
      padding: '14px',
      background: displaySettings.darkMode ? '#1e293b' : '#f9fafb',
      borderRadius: '10px',
      marginBottom: '12px',
      border: `1px solid ${allergyAlert ? '#ef4444' : (displaySettings.darkMode ? '#334155' : '#e5e7eb')}`,
      borderLeft: `4px solid ${allergyAlert ? '#ef4444' : getStatusColor(item.status)}`,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Allergy Alert Badge */}
      {allergyAlert && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#ef4444',
          color: '#ffffff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700',
          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
          zIndex: 10
        }}>
          ⚠️ ALLERGY
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '20px', fontWeight: '700', color: displaySettings.darkMode ? '#f8fafc' : '#111827' }}>{item.quantity}x</span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: displaySettings.darkMode ? '#f1f5f9' : '#374151' }}>{item.name}</span>
          
          {/* Course Badge */}
          {showCourseView && (
            <span style={{
              padding: '4px 10px',
              background: displaySettings.darkMode ? '#334155' : '#e5e7eb',
              color: displaySettings.darkMode ? '#94a3b8' : '#6b7280',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {course}
            </span>
          )}

          {/* Fire Time Badge */}
          {showCourseView && fireTime > 0 && (
            <span style={{
              padding: '4px 10px',
              background: fireTime < 5 ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              🔥 Fire in {fireTime}m
            </span>
          )}

          {speechEnabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSpeak();
              }}
              style={{
                padding: '6px 12px',
                background: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#7c3aed';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#8b5cf6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🗣️
            </button>
          )}
        </div>
        <select
          value={item.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            padding: '8px 16px',
            background: displaySettings.darkMode ? '#334155' : '#f3f4f6',
            color: displaySettings.darkMode ? '#f1f5f9' : '#111827',
            border: displaySettings.darkMode ? '1px solid #475569' : '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = displaySettings.darkMode ? '#64748b' : '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = displaySettings.darkMode ? '#475569' : '#d1d5db';
          }}
        >
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {item.notes && (
        <div style={{ 
          fontSize: '13px', 
          color: allergyAlert ? '#fca5a5' : (displaySettings.darkMode ? '#fbbf24' : '#92400e'), 
          marginTop: '6px', 
          fontWeight: '500', 
          padding: '8px 12px', 
          background: allergyAlert ? '#7f1d1d' : (displaySettings.darkMode ? '#78350f' : '#fef3c7'), 
          borderRadius: '6px',
          border: allergyAlert ? '1px solid #dc2626' : 'none'
        }}>
          {allergyAlert && '⚠️ '}{item.notes}
        </div>
      )}

      {item.modifications && item.modifications.length > 0 && (
        <div style={{ 
          fontSize: '12px', 
          color: displaySettings.darkMode ? '#94a3b8' : '#6b7280', 
          marginTop: '6px', 
          padding: '8px 12px', 
          background: displaySettings.darkMode ? '#334155' : '#f3f4f6', 
          borderRadius: '6px' 
        }}>
          {item.modifications.map((mod, i) => (
            <span key={i}>• {mod} </span>
          ))}
        </div>
      )}
    </div>
  );
}
