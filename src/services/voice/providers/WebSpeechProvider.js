import VoiceProvider from './VoiceProvider';

/**
 * Web Speech API Provider (Browser-only)
 * Uses Chrome/Edge/Safari built-in speech recognition
 */
class WebSpeechProvider extends VoiceProvider {
  constructor(config = {}) {
    super(config);
    this.recognition = null;
    this.isListening = false;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    // Detect Brave browser using multiple methods
    this.isBrave = this._detectBrave();
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = config.language || 'en-US';
    }
  }

  _detectBrave() {
    // Method 1: navigator.brave API
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      return navigator.brave.isBrave();
    }
    
    // Method 2: User agent detection (less reliable but fallback)
    const ua = navigator.userAgent;
    if (ua.includes('Brave')) {
      return true;
    }
    
    // Method 3: Check for Brave-specific features
    if (navigator.brave) {
      return true;
    }
    
    return false;
  }

  getProviderName() {
    return 'WebSpeech';
  }

  isSupported() {
    return this.isSupported;
  }

  getIsListening() {
    return this.isListening;
  }

  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  getSupportedLanguages() {
    return [
      'en-US', 'en-GB', 'en-IN',
      'hi-IN', 'ta-IN', 'te-IN',
      'bn-IN', 'mr-IN', 'gu-IN'
    ];
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async transcribe(options = {}, onInterimResult = null) {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const maxRetries = 3;
    const languages = options.language ? [options.language] : ['en-US', 'en-GB', 'en-IN'];
    const currentLang = languages[0];

    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Optimized settings for better accuracy on long orders
      recognition.continuous = true; // Enable continuous for long orders
      recognition.interimResults = true;
      recognition.lang = currentLang;
      
      // Add optimizations for better accuracy
      recognition.maxAlternatives = 3; // Get multiple recognition alternatives
      recognition.lang = currentLang;
      
      recognition.onresult = (event) => {
        console.log('Speech recognition onresult fired', event);
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          
          if (isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        console.log('Interim transcript:', interimTranscript);
        console.log('Final transcript:', finalTranscript);

        if (interimTranscript && onInterimResult) {
          onInterimResult(interimTranscript);
        }

        if (finalTranscript) {
          // Get the best result from multiple alternatives
          let bestTranscript = finalTranscript;
          let bestConfidence = event.results[event.results.length - 1][0].confidence || 0.85;
          
          // Check if we have multiple alternatives and pick the best one
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.length > 1) {
            let bestScore = 0;
            for (let i = 0; i < lastResult.length; i++) {
              const alt = lastResult[i];
              if (alt.confidence > bestScore) {
                bestScore = alt.confidence;
                bestTranscript = alt.transcript;
                bestConfidence = alt.confidence;
              }
            }
          }
          
          resolve({
            text: bestTranscript,
            language: recognition.lang,
            confidence: bestConfidence,
            duration: 0
          });
        }
      };
      
      recognition.onerror = (event) => {
        // Don't log expected errors to reduce console noise
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        console.log('Is Brave:', this.isBrave);
        
        let errorMessage = `Speech recognition failed: ${event.error}`;
        
        if (event.error === 'network') {
          if (this.isBrave) {
            errorMessage = 'Brave browser blocks speech recognition for privacy. Enable "Google voice search" in Brave Settings → Shields, or use Chrome/Edge.';
          } else {
            errorMessage = 'Speech recognition service unavailable. Please check your internet connection.';
          }
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please speak clearly and try again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else if (event.error === 'aborted') {
          errorMessage = 'Recording was stopped. Please try again.';
        }
        
        reject(new Error(errorMessage));
      };
      
      recognition.onend = () => {
        this.isListening = false;
      };
      
      recognition.onstart = () => {
        this.isListening = true;
      };
      
      recognition.start();
    });
  }
}

export default WebSpeechProvider;
