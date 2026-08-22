/**
 * Speech Transcription Service - Using Pluggable Provider Architecture
 * Supports Web Speech API, Firebase Cloud Functions, and Custom Backends
 */

import voiceProviderFactory from './providers/VoiceProviderFactory';

class SpeechTranscriptionService {
  constructor() {
    this.provider = voiceProviderFactory.getProvider();
  }

  /**
   * Transcribe speech using current provider
   * @param {Object} options - Transcription options
   * @param {Function} onInterimResult - Callback for interim results
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(options = {}, onInterimResult = null) {
    return this.provider.transcribe(options, onInterimResult);
  }

  /**
   * Start listening for speech
   * @param {Object} options - Recognition options
   * @param {Function} onInterimResult - Callback for interim results
   * @returns {Promise<Object>} Transcription result
   */
  async startListening(options = {}, onInterimResult = null) {
    return this.transcribe(options, onInterimResult);
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.provider.stopListening();
  }

  /**
   * Check if speech recognition is supported
   */
  checkSupport() {
    return this.provider.isSupported();
  }

  /**
   * Check if currently listening
   */
  getIsListening() {
    return this.provider.getIsListening();
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    this.provider.setLanguage(lang);
  }

  /**
   * Get available languages
   */
  getSupportedLanguages() {
    return this.provider.getSupportedLanguages();
  }

  /**
   * Get current provider name
   */
  getProviderName() {
    return this.provider.getProviderName();
  }

  /**
   * Switch to a different provider
   * @param {string} providerName - Name of provider to switch to
   * @param {Object} config - Optional config for the provider
   */
  switchProvider(providerName, config = {}) {
    voiceProviderFactory.switchProvider(providerName, config);
    this.provider = voiceProviderFactory.getProvider();
  }
}

// Singleton instance
const speechTranscriptionService = new SpeechTranscriptionService();

export default speechTranscriptionService;
