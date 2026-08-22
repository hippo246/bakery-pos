import VoiceProvider from './VoiceProvider';
import WebSpeechProvider from './WebSpeechProvider';
import TransformersWhisperProvider from './TransformersWhisperProvider';

/**
 * Voice Provider Factory
 * Pure frontend architecture - no backend required
 * Supports: WebSpeech (browser), TransformersWhisper (browser-based Whisper)
 */
class VoiceProviderFactory {
  constructor() {
    this.currentProvider = null;
    this.providerConfig = this._loadConfig();
  }

  /**
   * Load provider configuration
   * @private
   */
  _loadConfig() {
    // Default to WebSpeech for instant, no-download voice recognition
    return {
      provider: 'webspeech',
      language: 'en-US'
    };
  }

  /**
   * Get current provider instance
   * @returns {VoiceProvider}
   */
  getProvider() {
    if (!this.currentProvider) {
      this.currentProvider = this._createProvider();
    }
    return this.currentProvider;
  }

  /**
   * Create provider instance based on config
   * @private
   */
  _createProvider() {
    switch (this.providerConfig.provider.toLowerCase()) {
      case 'transformers':
        return new TransformersWhisperProvider(this.providerConfig);
      case 'webspeech':
      default:
        return new WebSpeechProvider(this.providerConfig);
    }
  }

  /**
   * Switch to a different provider
   * @param {string} providerName - Name of provider to switch to
   * @param {Object} config - Optional config for the provider
   */
  switchProvider(providerName, config = {}) {
    this.providerConfig = {
      provider: providerName,
      ...config
    };
    this.currentProvider = this._createProvider();
  }

  /**
   * Get available providers
   * @returns {Array<string>}
   */
  getAvailableProviders() {
    return ['transformers', 'webspeech'];
  }

  /**
   * Get current provider name
   * @returns {string}
   */
  getCurrentProviderName() {
    return this.providerConfig.provider;
  }
}

// Singleton instance
const voiceProviderFactory = new VoiceProviderFactory();

export default voiceProviderFactory;
