/**
 * Transformers.js Whisper Provider - Browser-based Speech Recognition
 * Runs entirely in the browser using WebGPU/WASM
 * No backend required - pure frontend architecture
 * Compatible with Brave browser
 */

import VoiceProvider from './VoiceProvider';
import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class TransformersWhisperProvider extends VoiceProvider {
  constructor(config = {}) {
    super(config);
    this.isListening = false;
    this.model = null;
    this.modelName = config.modelName || 'Xenova/whisper-tiny';
    this.language = config.language || 'english';
    this.progressCallback = null;
    this.isModelLoaded = false;
  }

  getProviderName() {
    return 'TransformersWhisper';
  }

  isSupported() {
    return typeof window !== 'undefined' && typeof WebAssembly !== 'undefined';
  }

  getIsListening() {
    return this.isListening;
  }

  setLanguage(lang) {
    this.language = lang;
  }

  getSupportedLanguages() {
    return [
      'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
      'dutch', 'russian', 'chinese', 'japanese', 'korean', 'hindi'
    ];
  }

  stopListening() {
    this.isListening = false;
  }

  async _loadModel(progressCallback = null) {
    this.progressCallback = progressCallback;

    if (this.isModelLoaded && this.model) {
      return this.model;
    }

    if (this.progressCallback) {
      this.progressCallback({ progress: 0, message: 'Loading model...' });
    }

    try {
      this.model = await pipeline('automatic-speech-recognition', this.modelName, {
        progress_callback: (progress) => {
          if (this.progressCallback) {
            this.progressCallback({
              progress: progress.progress || 0,
              message: `Downloading model: ${Math.round((progress.progress || 0) * 100)}%`
            });
          }
        }
      });

      this.isModelLoaded = true;
      return this.model;
    } catch (error) {
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  async transcribe(options = {}, onInterimResult = null) {
    this.isListening = true;

    try {
      // Load model if not loaded
      if (!this.isModelLoaded) {
        await this._loadModel(options.progressCallback);
      }
      
      // For browser-based transcription, we need audio data
      if (!options.audioData) {
        this.isListening = false;
        throw new Error('No audio data provided. Please record audio first.');
      }

      if (this.progressCallback) {
        this.progressCallback({ progress: 1, message: 'Transcribing audio...' });
      }

      // Convert audio data if needed
      let audioInput = options.audioData;
      
      // If it's a Blob, convert to AudioBuffer
      if (audioInput instanceof Blob) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioInput.arrayBuffer();
        audioInput = await audioContext.decodeAudioData(arrayBuffer);
      }

      // Transcribe using Transformers.js
      const result = await this.model(audioInput, {
        language: options.language || this.language,
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5
      });

      this.isListening = false;

      return {
        text: result.text || '',
        language: options.language || this.language,
        confidence: 0.9,
        duration: options.duration || 0,
        model: this.modelName
      };
    } catch (error) {
      this.isListening = false;
      console.error('Transformers.js transcription error:', error);
      throw new Error(`Transformers.js transcription failed: ${error.message}`);
    }
  }

  async checkHealth() {
    try {
      // Check if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        return {
          supported: false,
          reason: 'WebAssembly not supported',
          webgpu: false,
          wasm: false
        };
      }
      
      // Check if WebGPU is available
      const webgpuAvailable = typeof navigator !== 'undefined' && navigator.gpu !== undefined;
      
      return {
        supported: true,
        webgpu: webgpuAvailable,
        wasm: true,
        reason: webgpuAvailable ? 'WebGPU available' : 'WASM fallback'
      };
    } catch (error) {
      console.error('Transformers.js health check failed:', error);
      return {
        supported: false,
        reason: error.message,
        webgpu: false,
        wasm: false
      };
    }
  }

  getModelName() {
    return this.modelName;
  }

  setModelName(modelName) {
    this.modelName = modelName;
    this.model = null;
    this.isModelLoaded = false;
  }

  getAvailableModels() {
    return [
      'Xenova/whisper-tiny',
      'Xenova/whisper-base',
      'Xenova/whisper-small',
      'Xenova/whisper-medium'
    ];
  }
}

export default TransformersWhisperProvider;
