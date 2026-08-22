/**
 * Abstract Voice Provider Interface
 * All voice providers must implement this interface
 */
class VoiceProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Transcribe audio to text
   * @param {Object} options - Transcription options
   * @param {Function} onInterimResult - Callback for interim results
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(options = {}, onInterimResult = null) {
    throw new Error('transcribe() must be implemented by subclass');
  }

  /**
   * Check if provider is supported
   * @returns {boolean}
   */
  isSupported() {
    throw new Error('isSupported() must be implemented by subclass');
  }

  /**
   * Check if currently listening
   * @returns {boolean}
   */
  getIsListening() {
    throw new Error('getIsListening() must be implemented by subclass');
  }

  /**
   * Stop listening
   */
  stopListening() {
    throw new Error('stopListening() must be implemented by subclass');
  }

  /**
   * Get supported languages
   * @returns {Array<string>}
   */
  getSupportedLanguages() {
    throw new Error('getSupportedLanguages() must be implemented by subclass');
  }

  /**
   * Set language
   * @param {string} lang - Language code
   */
  setLanguage(lang) {
    throw new Error('setLanguage() must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getProviderName() {
    throw new Error('getProviderName() must be implemented by subclass');
  }
}

export default VoiceProvider;
