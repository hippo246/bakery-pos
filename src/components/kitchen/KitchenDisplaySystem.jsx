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

    // Priority order for voice selection
    const priorities = [
      // Prefer English voices
      (voice) => voice.lang.startsWith('en-'),
      // Prefer local service voices
      (voice) => voice.localService === true,
      // Prefer voices that don't include "Google" (better for some browsers)
      (voice) => !voice.name.includes('Google'),
      // Prefer voices with full names
      (voice) => voice.name.length > 10
    ];

    let candidates = [...this.voices];
    
    for (const priority of priorities) {
      if (candidates.length > 1) {
        candidates = candidates.filter(priority);
      }
    }

    this.selectedVoice = candidates[0] || this.voices[0];
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

export default function KitchenDisplaySystem() {
  const [kotManager] = useState(() => getKOTManager());
  const [kots, setKots] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastKOTCount, setLastKOTCount] = useState(0);
  const [selectedStation, setSelectedStation] = useState('all');
  const audioRef = useRef(null);
  const speechManagerRef = useRef(null);

  // Initialize speech manager
  useEffect(() => {
    speechManagerRef.current = new SpeechManager();
    console.log('Speech Manager instance created');
  }, []);

  const loadKOTs = () => {
    // Get all KOTs without filtering
    try {
      const allKOTs = kotManager.getAllKOTs();
      console.log('Loading KOTs from manager:', allKOTs);
      console.log('KOT count:', allKOTs.length);
      console.log('KOT manager state:', kotManager);
      console.log('Current state - soundEnabled:', soundEnabled, 'speechEnabled:', speechEnabled);
      
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
        
        // Filter by station if not 'all'
        const filteredKOTs = selectedStation === 'all' 
          ? updatedKOTs 
          : updatedKOTs.filter(kot => kot.station === selectedStation);
        
        setKots(filteredKOTs);
        
        // Check for new orders and speak them
        if (updatedKOTs.length > lastKOTCount) {
          const newKOTs = updatedKOTs.slice(lastKOTCount);
          console.log('New KOTs detected:', newKOTs);
          
          // Speak new orders if speech is enabled
          if (speechEnabled && newKOTs.length > 0) {
            console.log('Speech enabled, attempting to speak new orders');
            newKOTs.forEach((kot, index) => {
              // Delay each speech slightly to avoid overlap
              setTimeout(() => {
                console.log('Speaking new order:', kot);
                speakOrder(kot);
              }, index * 1000);
            });
          } else {
            console.log('Speech disabled or no new KOTs');
            // Only beep if speech is disabled AND sound is enabled
            if (soundEnabled && !speechEnabled) {
              console.log('Sound enabled and speech disabled, playing beep');
              playAlertSound();
            } else {
              console.log('Not playing beep - soundEnabled:', soundEnabled, 'speechEnabled:', speechEnabled);
            }
          }
        }
      } catch (error) {
        console.error('Error processing QR orders:', error);
        
        // Filter by station if not 'all'
        const filteredKOTs = selectedStation === 'all' 
          ? allKOTs 
          : allKOTs.filter(kot => kot.station === selectedStation);
        
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
    console.log('playAlertSound called, soundEnabled:', soundEnabled);
    if (!soundEnabled) {
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
    if (!speechEnabled) {
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

  const speakItem = (item) => {
    if (!speechEnabled) return;
    
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
    console.log('Speech enabled:', speechEnabled);
    console.log('Sound enabled:', soundEnabled);
    console.log('Speech synthesis supported:', 'speechSynthesis' in window);
    console.log('KOT Manager instance:', kotManager);
    
    loadKOTs();
    loadStatistics();

    // Subscribe to KOT events
    const handleKOTUpdate = () => {
      console.log('KOT update event received');
      loadKOTs();
      loadStatistics();
    };

    kotManager.on('kotCreated', handleKOTUpdate);
    kotManager.on('kotItemUpdated', handleKOTUpdate);
    kotManager.on('kotStatusUpdated', handleKOTUpdate);
    kotManager.on('kotPriorityUpdated', handleKOTUpdate);
    kotManager.on('kotCancelled', handleKOTUpdate);

    console.log('Subscribed to KOT events');

    // Auto refresh interval
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing KOTs');
        loadKOTs();
        loadStatistics();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      // Clean up event listeners
      kotManager.off('kotCreated', handleKOTUpdate);
      kotManager.off('kotItemUpdated', handleKOTUpdate);
      kotManager.off('kotStatusUpdated', handleKOTUpdate);
      kotManager.off('kotPriorityUpdated', handleKOTUpdate);
      kotManager.off('kotCancelled', handleKOTUpdate);
      
      // Clean up interval
      if (refreshInterval) clearInterval(refreshInterval);
      
      // Clean up speech manager
      if (speechManagerRef.current) {
        speechManagerRef.current.cancel();
      }
    };
  }, [autoRefresh, kotManager, speechEnabled, soundEnabled, selectedStation]);

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
      kotManager.updateItemStatus(kotId, kotItemId, newStatus);
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleKOTStatusChange = (kotId, newStatus) => {
    try {
      kotManager.updateKOTStatus(kotId, newStatus);
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
      }
    } catch (error) {
      console.error('Error cancelling KOT:', error);
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
      background: '#0f172a',
      minHeight: '100vh',
      color: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#1e293b',
        padding: '24px 32px',
        borderBottom: '2px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.5px' }}>
            🍳 Kitchen Display System
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px', fontWeight: '400' }}>
            Real-time order management
          </p>
        </div>
        
        {/* Statistics */}
        {statistics && (
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: '#334155', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                {statistics.active}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: '#334155', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                {statistics.byStatus.pending}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: '#334155', borderRadius: '12px', minWidth: '80px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                {statistics.overdue}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Overdue</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        background: '#0f172a',
        padding: '16px 24px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {/* Station Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginRight: '8px' }}>STATION:</span>
          {stations.map(station => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              style={{
                padding: '10px 16px',
                background: selectedStation === station.id ? '#3b82f6' : '#1e293b',
                color: selectedStation === station.id ? '#ffffff' : '#94a3b8',
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
                  e.target.style.background = '#334155';
                  e.target.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStation !== station.id) {
                  e.target.style.background = '#1e293b';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              {station.icon} {station.name}
            </button>
          ))}
        </div>

        {/* Sound & Speech Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => {
              console.log('Sound toggle clicked, current soundEnabled:', soundEnabled);
              setSoundEnabled(!soundEnabled);
            }}
            style={{
              padding: '10px 16px',
              background: soundEnabled ? '#10b981' : '#1e293b',
              color: soundEnabled ? '#ffffff' : '#94a3b8',
              border: soundEnabled ? '2px solid #34d399' : '2px solid transparent',
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
              if (!soundEnabled) {
                e.target.style.background = '#334155';
                e.target.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!soundEnabled) {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#94a3b8';
              }
            }}
          >
            {soundEnabled ? '🔊' : '🔇'} Sound
          </button>
          <button
            onClick={() => {
              console.log('Speech toggle clicked, current speechEnabled:', speechEnabled);
              setSpeechEnabled(!speechEnabled);
            }}
            style={{
              padding: '10px 16px',
              background: speechEnabled ? '#8b5cf6' : '#1e293b',
              color: speechEnabled ? '#ffffff' : '#94a3b8',
              border: speechEnabled ? '2px solid #a78bfa' : '2px solid transparent',
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
              if (!speechEnabled) {
                e.target.style.background = '#334155';
                e.target.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!speechEnabled) {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#94a3b8';
              }
            }}
          >
            {speechEnabled ? '🗣️' : '🔇'} Speech
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '10px 16px',
              background: autoRefresh ? '#3b82f6' : '#1e293b',
              color: autoRefresh ? '#ffffff' : '#94a3b8',
              border: autoRefresh ? '2px solid #60a5fa' : '2px solid transparent',
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
              if (!autoRefresh) {
                e.target.style.background = '#334155';
                e.target.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!autoRefresh) {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#94a3b8';
              }
            }}
          >
            {autoRefresh ? '🔄' : '⏸️'} Auto
          </button>
          <button
            onClick={() => {
              console.log('Manual refresh clicked');
              console.log('Current state - soundEnabled:', soundEnabled, 'speechEnabled:', speechEnabled);
              loadKOTs();
              loadStatistics();
            }}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: '2px solid #60a5fa',
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
              e.target.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KOT Grid */}
      <div style={{ 
        padding: '24px',
        background: '#0f172a',
        minHeight: 'calc(100vh - 200px)'
      }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px'
          }}>
            {kots.map(kot => (
              <KOTCard
                key={kot.kotId}
                kot={kot}
                onItemStatusChange={handleItemStatusChange}
                onKOTStatusChange={handleKOTStatusChange}
                onMarkUrgent={handleMarkUrgent}
                onCancelKOT={handleCancelKOT}
                onSpeakOrder={speakOrder}
                onSpeakItem={speakItem}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                speechEnabled={speechEnabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// KOT Card Component
function KOTCard({ kot, onItemStatusChange, onKOTStatusChange, onMarkUrgent, onCancelKOT, onSpeakOrder, onSpeakItem, getStatusColor, getPriorityColor, speechEnabled }) {
  const [expanded, setExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const timeElapsed = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000);
  const isOverdue = kot.estimatedReadyAt ? new Date() > new Date(kot.estimatedReadyAt) && kot.status !== KOTStatus.SERVED : false;

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
      background: '#1e293b',
      borderRadius: '12px',
      border: `2px solid ${isOverdue ? '#ef4444' : kot.priority === KOTPriority.URGENT ? '#ef4444' : '#334155'}`,
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
        background: isOverdue ? '#7f1d1d' : kot.priority === KOTPriority.URGENT ? '#7f1d1d' : '#334155',
        borderBottom: '1px solid #475569',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.5px' }}>#{kot.orderNumber}</span>
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
              {kot.priority}
            </span>
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
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>👤</span>
            <span>{kot.customer?.name || 'Walk-in'}</span>
          </div>
          {kot.customer?.table && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#94a3b8' }}>🪑</span>
              <span>{kot.customer.table}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>⏱️</span>
            <span>{timeElapsed}m ago</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: '16px 20px', background: '#1e293b' }}>
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
              />
            ))}
          </div>

          {/* Notes */}
          {kot.notes && (
            <div style={{
              padding: '12px',
              background: '#334155',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#cbd5e1',
              borderLeft: '3px solid #f59e0b'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>NOTES</div>
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
              onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.SERVED)}
              style={{
                padding: '8px 16px',
                background: '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#475569'}
              onMouseLeave={(e) => e.target.style.background = '#64748b'}
            >
              🍽️ Served
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
            {speechEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeakOrder(kot);
                }}
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
                🗣️ Speak
              </button>
            )}
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
          </div>
        </div>
      )}
    </div>
  );
}

// KOT Item Component
function KOTItem({ item, onStatusChange, onSpeak, getStatusColor, speechEnabled }) {
  return (
    <div style={{
      padding: '14px',
      background: '#1e293b',
      borderRadius: '10px',
      marginBottom: '12px',
      border: '1px solid #334155',
      borderLeft: `4px solid ${getStatusColor(item.status)}`,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>{item.quantity}x</span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>{item.name}</span>
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
            background: '#334155',
            color: '#f1f5f9',
            border: '1px solid #475569',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#64748b';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#475569';
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
        <div style={{ fontSize: '13px', color: '#fbbf24', marginTop: '6px', fontWeight: '500', padding: '8px 12px', background: '#78350f', borderRadius: '6px' }}>
          📝 {item.notes}
        </div>
      )}

      {item.modifications && item.modifications.length > 0 && (
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', padding: '8px 12px', background: '#334155', borderRadius: '6px' }}>
          {item.modifications.map((mod, i) => (
            <span key={i}>• {mod} </span>
          ))}
        </div>
      )}
    </div>
  );
}
