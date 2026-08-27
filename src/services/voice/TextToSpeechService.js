/**
 * Text-to-Speech Service - Using Web Speech API
 * Provides speech synthesis for reading aloud CRM information
 */

class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.lang = 'en-IN';
    this.voicesLoaded = false;

    // Load voices when available
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this.voicesLoaded = true;
        this._selectDefaultVoice();
        console.log('Text-to-speech voices loaded:', this.voices.length);
      };
      // Initial load
      this.voices = this.synth.getVoices();
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
        this._selectDefaultVoice();
        console.log('Text-to-speech voices loaded immediately:', this.voices.length);
      } else {
        console.log('Text-to-speech voices not loaded yet, waiting for onvoiceschanged event');
      }
    } else {
      console.error('Speech synthesis not supported in this browser');
    }
  }

  /**
   * Select default voice (prefer English-India if available)
   * @private
   */
  _selectDefaultVoice() {
    // Try to find English-India voice first
    const indianVoice = this.voices.find(voice => 
      voice.lang === 'en-IN' || voice.lang === 'hi-IN'
    );
    if (indianVoice) {
      this.selectedVoice = indianVoice;
      return;
    }

    // Fallback to any English voice
    const englishVoice = this.voices.find(voice => 
      voice.lang.startsWith('en')
    );
    if (englishVoice) {
      this.selectedVoice = englishVoice;
    }
  }

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   */
  speak(text, options = {}) {
    console.log('TextToSpeechService.speak called with text:', text);
    console.log('Voices loaded:', this.voicesLoaded, 'Available voices:', this.voices.length);
    console.log('Selected voice:', this.selectedVoice);
    console.log('Speech synthesis supported:', !!this.synth);

    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      return false;
    }

    // Cancel any current speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    utterance.voice = options.voice || this.selectedVoice;
    utterance.rate = options.rate !== undefined ? options.rate : this.rate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : this.pitch;
    utterance.volume = options.volume !== undefined ? options.volume : this.volume;
    utterance.lang = options.lang || this.lang;

    console.log('Utterance configured:', {
      voice: utterance.voice,
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume,
      lang: utterance.lang
    });

    // Event handlers
    utterance.onstart = () => {
      console.log('Speech started');
      this.isSpeaking = true;
      this.isPaused = false;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      console.log('Speech ended');
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      
      // Handle specific error types
      let errorMessage = event.error;
      if (event.error === 'synthesis-failed') {
        errorMessage = 'Speech synthesis failed. The voice may not be available.';
      } else if (event.error === 'canceled') {
        errorMessage = 'Speech was canceled.';
      } else if (event.error === 'interrupted') {
        errorMessage = 'Speech was interrupted.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Speech synthesis not allowed.';
      }
      
      if (options.onError) options.onError(errorMessage);
    };

    utterance.onpause = () => {
      console.log('Speech paused');
      this.isPaused = true;
      if (options.onPause) options.onPause();
    };

    utterance.onresume = () => {
      console.log('Speech resumed');
      this.isPaused = false;
      if (options.onResume) options.onResume();
    };

    this.currentUtterance = utterance;
    console.log('Calling synth.speak()');
    this.synth.speak(utterance);
    return true;
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  /**
   * Cancel speech
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking() {
    return this.isSpeaking;
  }

  /**
   * Check if currently paused
   */
  getIsPaused() {
    return this.isPaused;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Set voice
   */
  setVoice(voice) {
    this.selectedVoice = voice;
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set speech pitch (0 to 2)
   */
  setPitch(pitch) {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    this.lang = lang;
    this._selectDefaultVoice();
  }

  /**
   * Check if speech synthesis is supported
   */
  isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Generate order speech text
   */
  generateOrderSpeechText(order) {
    if (!order) return '';

    const items = order.items || [];
    const itemsText = items.map(item => 
      `${item.quantity} ${item.name}`
    ).join(', ');

    return `Order number ${order.id || ''}. Table ${order.tableNumber || 'not assigned'}. ${itemsText}. Total ${order.total || 0} rupees. Payment ${order.paymentStatus || 'pending'}.`;
  }

  /**
   * Generate dashboard speech text
   */
  generateDashboardSpeechText(metrics) {
    if (!metrics) return '';

    const greeting = this._getGreeting();
    return `${greeting}. You have ${metrics.pendingOrders || 0} pending orders, ${metrics.activeOrders || 0} orders in progress, and ${metrics.lowStockItems || 0} low stock items.`;
  }

  /**
   * Generate inventory alert speech text
   */
  generateInventoryAlertSpeechText(item) {
    if (!item) return '';

    return `Low stock alert. ${item.name} has ${item.quantity} ${item.unit || 'units'} remaining.`;
  }

  /**
   * Generate delivery speech text
   */
  generateDeliverySpeechText(delivery) {
    if (!delivery) return '';

    const items = delivery.items || [];
    const itemsText = items.map(item => 
      `${item.quantity} ${item.name}`
    ).join(', ');

    return `Delivery ${delivery.id || ''}. Customer ${delivery.customerName || 'unknown'}. ${itemsText}. Payment ${delivery.paymentStatus || 'pending'}.`;
  }

  /**
   * Get time-based greeting
   * @private
   */
  _getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Hello';
  }
}

// Singleton instance
const textToSpeechService = new TextToSpeechService();

export default textToSpeechService;
