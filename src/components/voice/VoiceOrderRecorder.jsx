import React, { useState, useRef, useEffect } from 'react';
import speechTranscriptionService from '../../services/voice/SpeechTranscriptionService';
import orderParserService from '../../services/voice/OrderParserService';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' }
];

/**
 * Voice Order Recorder Component
 * Allows waiters to speak orders naturally using Web Speech API
 */
function VoiceOrderRecorder({ 
  menuItems = [],
  onOrderParsed,
  onCancel
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedOrder, setParsedOrder] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasSpeechActivity, setHasSpeechActivity] = useState(false);
  const [error, setError] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const retryCountRef = useRef(0);
  const animationFrameRef = useRef(null);
  const textareaRef = useRef(null);
  const lastInputMethodRef = useRef('voice');

  // Keep a ref mirror of isRecording so async loops (audio meter, retries)
  // always read the live value instead of a stale closure.
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Network detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only clear the error if it's the network one we set - don't
      // clobber an unrelated error (e.g. mic permission) that might be showing.
      setError(prev => (prev === 'Network connection lost. Please check your internet connection.' ? null : prev));
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('Network connection lost. Please check your internet connection.');
      // Previously the mic kept running (and the UI stayed stuck on
      // "Recording...") even after connectivity dropped. Stop it now.
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        setIsRecording(false);
        stopAudioMonitoring();
        speechTranscriptionService.stopListening();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Audio level monitoring
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        // Use the ref (not the isRecording state) so this loop always sees the
        // live recording status instead of the value captured when it started.
        if (!isRecordingRef.current || !analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        if (average > 30) {
          setHasSpeechActivity(true);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('Error starting audio monitoring:', err);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      // Stop the actual mic tracks - otherwise the browser's "mic in use"
      // indicator stays on and the mic stays reserved after recording ends.
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
    setHasSpeechActivity(false);
  };

  // Shared by both the recording and parsing error paths - previously this
  // exact if/else chain was duplicated in two places and had drifted apart.
  const getErrorDetails = (err) => {
    let message = 'Failed to process transcription. Please try again.';
    let shouldRetry = false;

    if (err.message) {
      if (err.message.includes('network') || err.message.includes('connection')) {
        message = 'Network error. Please check your internet connection and try again.';
        shouldRetry = true;
      } else if (err.message.includes('permission') || err.message.includes('allowed')) {
        message = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (err.message.includes('not-allowed') || err.message.includes('denied')) {
        message = 'Access denied. Please check your browser permissions.';
      } else if (err.message.includes('no-speech') || err.message.includes('speech')) {
        message = 'No speech detected. Please speak clearly and closer to the microphone.';
        shouldRetry = true;
      } else if (err.message.includes('audio') || err.message.includes('microphone')) {
        message = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.message.includes('aborted')) {
        message = 'Recording was stopped. Please try again.';
      } else if (err.message.includes('timeout')) {
        message = 'Request timed out. Please try again.';
        shouldRetry = true;
      } else {
        message = err.message;
      }
    }

    return { message, shouldRetry };
  };

  const startRecording = async () => {
    try {
      if (!isOnline) {
        setError('Network connection lost. Please check your internet connection.');
        return;
      }

      isRecordingRef.current = true;
      lastInputMethodRef.current = 'voice';
      setIsRecording(true);
      setError(null);
      setFinalTranscript('');
      setInterimTranscript('');
      setHasSpeechActivity(false);
      
      await startAudioMonitoring();

      const transcription = await speechTranscriptionService.transcribe({
        language: selectedLanguage,
        confidenceThreshold,
        onInterimResult: (interim) => {
          setInterimTranscript(interim);
        }
      });

      isRecordingRef.current = false;
      setFinalTranscript(transcription.text);
      setIsRecording(false);
      stopAudioMonitoring();

      // Parse the transcribed text
      await processTranscription(transcription.text, transcription.confidence);

    } catch (err) {
      console.error('Recording error:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      stopAudioMonitoring();

      const { message: errorMessage, shouldRetry } = getErrorDetails(err);

      // Auto-retry for certain errors. Uses retryCountRef rather than the
      // retryCount state - a state value captured in this closure would go
      // stale across recursive setTimeout calls and never actually increment,
      // so retries could exceed maxRetries or never stop.
      if (shouldRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        console.log(`Auto-retry ${retryCountRef.current}/${maxRetries}`);
        setTimeout(() => {
          startRecording();
        }, 1000);
        return;
      }

      setError(errorMessage);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopAudioMonitoring();
    speechTranscriptionService.stopListening();
  };

  const processTranscription = async (text, speechConfidence) => {
    setIsProcessing(true);
    setError(null);

    try {
      const parsed = await orderParserService.parseOrder(text, menuItems);
      
      // Validate parsed order
      const validation = orderParserService.validateOrder(parsed, menuItems);

      // Combine speech-recognition confidence with the order-parser's own
      // confidence - previously speechConfidence was accepted but never
      // used, so a low-confidence (possibly mis-heard) transcription could
      // still auto-confirm as long as the parser felt sure about the text
      // it was given.
      const overallConfidence = Math.min(
        typeof speechConfidence === 'number' ? speechConfidence : 1,
        parsed.confidence
      );

      const fullOrder = {
        ...parsed,
        transcription: text,
        speechConfidence,
        confidence: overallConfidence,
        validation
      };

      setParsedOrder(fullOrder);

      // Auto-confirm only if confidence clears the user's chosen threshold
      // (previously hardcoded to 0.8, so the slider above did nothing) and
      // there are no validation errors. Pass fullOrder directly rather than
      // relying on the parsedOrder state, which hasn't re-rendered yet.
      if (validation.valid && overallConfidence > confidenceThreshold) {
        handleConfirm(fullOrder);
      }

    } catch (err) {
      console.error('Error processing transcription:', err);

      const { message: errorMessage, shouldRetry } = getErrorDetails(err);

      if (shouldRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        console.log(`Auto-retry ${retryCountRef.current}/${maxRetries}`);
        setTimeout(() => {
          startRecording();
        }, 1000);
        return;
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = (orderToConfirm = parsedOrder) => {
    if (orderToConfirm && onOrderParsed) {
      onOrderParsed(orderToConfirm);
      resetState();
    }
  };

  const handleEdit = () => {
    // Add items to cart for editing using existing cart functionality
    if (parsedOrder && onOrderParsed) {
      onOrderParsed({ ...parsedOrder, forEditing: true });
      resetState();
    }
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    setRetryCount(0);

    if (lastInputMethodRef.current === 'manual') {
      // Keep them in the text editor with their previous text intact
      // instead of silently switching to voice recording.
      setParsedOrder(null);
      setError(null);
      setShowTextInput(true);
      return;
    }

    resetState();
    startRecording();
  };

  const handleCancel = () => {
    resetState();
    if (onCancel) onCancel();
  };

  const resetState = () => {
    setParsedOrder(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setShowTextInput(false);
    setManualInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setError(null);
    retryCountRef.current = 0;
    setRetryCount(0);
  };

  const handleManualInput = () => {
    setShowTextInput(true);
    setManualInput('');
  };

  const refreshSuggestions = (value) => {
    if (value.length >= 1) {
      const newSuggestions = orderParserService.getSuggestions(value, menuItems);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleManualInputChange = (e) => {
    const value = e.target.value;
    setManualInput(value);
    refreshSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    const currentText = manualInput.trim();
    const lastWordStart = currentText.lastIndexOf(' ');
    const newText = lastWordStart === -1 
      ? suggestion.name 
      : currentText.substring(0, lastWordStart + 1) + suggestion.name;
    
    setManualInput(newText + ' ');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }
  };

  const handleConfirmManualInput = async () => {
    if (!manualInput.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    lastInputMethodRef.current = 'manual';

    try {
      const parsed = await orderParserService.parseOrder(manualInput, menuItems);
      const validation = orderParserService.validateOrder(parsed, menuItems);

      const fullOrder = {
        ...parsed,
        transcription: manualInput,
        validation
      };

      setParsedOrder(fullOrder);
      setShowTextInput(false);

      if (validation.valid) {
        handleConfirm(fullOrder);
      }
    } catch (err) {
      console.error('Error processing manual input:', err);
      setError(err.message || 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelManualInput = () => {
    setShowTextInput(false);
    setManualInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Initial state
  if (!isRecording && !parsedOrder && !error && !isProcessing && !showTextInput) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎤</div>
          <h3 style={{ margin: '0 0 8px', color: '#0a0a0a', fontSize: '16px', fontWeight: '600' }}>
            Voice Order
          </h3>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            Speak to add items to cart
          </div>
        </div>

        {!isOnline && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            📡 You're offline. Voice and typed orders need a connection to parse.
          </div>
        )}

        {/* Language Selection */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Language
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                aria-pressed={selectedLanguage === lang.code}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedLanguage === lang.code ? '#2563eb' : '#f3f4f6',
                  color: selectedLanguage === lang.code ? '#ffffff' : '#111111',
                  border: selectedLanguage === lang.code ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedLanguage !== lang.code) {
                    e.target.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLanguage !== lang.code) {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Threshold */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
          </div>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', maxWidth: '300px' }}
          />
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Higher = more accurate but requires clearer speech
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={startRecording}
            disabled={!isOnline}
            aria-disabled={!isOnline}
            style={{
              padding: '12px 24px',
              backgroundColor: isOnline ? '#2563eb' : '#93c5fd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isOnline ? 'pointer' : 'not-allowed',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (isOnline) {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (isOnline) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
              }
            }}
          >
            🎤 Start Recording
          </button>
          <button
            onClick={handleManualInput}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#111111',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
          >
            ⌨️ Type Instead
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
          💡 <strong>Tips:</strong> Speak clearly and naturally. Say quantities before items (e.g., "2 croissants"). 
          Mention table number (e.g., "table 5").
        </div>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h3 style={{ margin: '0 0 8px', color: '#2563eb', fontSize: '20px' }}>
          Processing...
        </h3>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Analyzing your order
        </p>
        {finalTranscript && (
          <p style={{ margin: '12px 0 0', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
            "{finalTranscript}"
          </p>
        )}
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🎤</div>
          <h3 style={{ margin: '0 0 8px', color: '#0a0a0a', fontSize: '16px', fontWeight: '600' }}>
            Recording...
          </h3>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            {interimTranscript ? `"${interimTranscript}"` : 'Speak your order now'}
          </div>
        </div>

        {/* Live mic level meter */}
        <div
          role="progressbar"
          aria-label="Microphone input level"
          aria-valuenow={Math.round(audioLevel * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6',
            overflow: 'hidden',
            marginBottom: '8px'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.round(audioLevel * 100))}%`,
              backgroundColor: hasSpeechActivity ? '#22c55e' : '#93c5fd',
              transition: 'width 0.1s ease, background-color 0.2s ease'
            }}
          />
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginBottom: '16px' }}>
          {hasSpeechActivity ? '🎧 Picking up your voice' : 'Waiting for speech...'}
        </div>

        {/* Language indicator */}
        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          🌐 {LANGUAGES.find(lang => lang.code === selectedLanguage)?.name || selectedLanguage}
        </div>

        <button
          onClick={stopRecording}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ef4444';
          }}
        >
          ⏹️ Stop Recording
        </button>
      </div>
    );
  }

  // Manual text input state
  if (showTextInput) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px', marginRight: '12px' }}>⌨️</span>
          <h3 style={{ margin: 0, color: '#3b82f6' }}>Type Your Order</h3>
        </div>

        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px'
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <textarea
            ref={textareaRef}
            value={manualInput}
            onChange={handleManualInputChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 2 croissants, 1 coffee, table 5"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #8b5cf6',
              fontSize: '16px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            autoFocus
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '2px solid #8b5cf6',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: index === selectedSuggestionIndex ? '#ede9fe' : 'transparent',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#0a0a0a' }}>
                      {suggestion.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      ₹{suggestion.price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    backgroundColor: '#dbeafe',
                    color: '#3b82f6',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    {Math.round(suggestion.matchScore * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick number pad */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => {
                  const needsSpace = manualInput.length > 0 && !/\s$/.test(manualInput);
                  const next = manualInput + (needsSpace ? ' ' : '') + num;
                  setManualInput(next);
                  refreshSuggestions(next);
                  textareaRef.current?.focus();
                }}
                aria-label={`Insert ${num}`}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#111111',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minWidth: '40px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCancelManualInput}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#111111',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmManualInput}
            disabled={!manualInput.trim()}
            style={{
              flex: 2,
              padding: '12px 24px',
              backgroundColor: manualInput.trim() ? '#2563eb' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: manualInput.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (manualInput.trim()) {
                e.target.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (manualInput.trim()) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
          >
            ✓ Add to Order
          </button>
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
          💡 <strong>Tips:</strong> Type quantities before items (e.g., "2 croissants"). Use commas or "and" to separate items. Type "table X" for table number.
        </div>
      </div>
    );
  }

  // Parsed order confirmation
  if (parsedOrder) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>{parsedOrder.validation?.valid === false ? '⚠️' : '✓'}</span>
            <h3 style={{ margin: 0, color: '#0a0a0a', fontSize: '16px', fontWeight: '600' }}>
              {parsedOrder.validation?.valid === false ? 'Needs Review' : 'Order Parsed'}
            </h3>
          </div>
          {typeof parsedOrder.confidence === 'number' && (
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: parsedOrder.confidence > confidenceThreshold ? '#dcfce7' : '#fef3c7',
              color: parsedOrder.confidence > confidenceThreshold ? '#166534' : '#92400e'
            }}>
              {Math.round(parsedOrder.confidence * 100)}% confidence
            </span>
          )}
        </div>

        {/* Validation issues, if any - previously computed by orderParserService
            but never surfaced anywhere in the UI */}
        {parsedOrder.validation?.valid === false && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '12px'
          }}>
            {Array.isArray(parsedOrder.validation.errors) && parsedOrder.validation.errors.length > 0
              ? parsedOrder.validation.errors.join(' ')
              : 'Please double-check this order before adding it.'}
          </div>
        )}

        {/* What was actually heard/typed, so the user can sanity-check the
            parse - previously captured on the order object but never shown. */}
        {parsedOrder.transcription && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            "{parsedOrder.transcription}"
          </div>
        )}

        {/* Table */}
        {parsedOrder.tableNumber && (
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#111111', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px' }}>
            Table {parsedOrder.tableNumber}
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          {parsedOrder.items.map((item, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: index < parsedOrder.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                fontSize: '13px'
              }}
            >
              <span style={{ color: '#111111' }}>{item.quantity}x {item.name}</span>
              <span style={{ fontWeight: '600', color: '#2563eb' }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {parsedOrder.notes && (
          <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
            Notes: {parsedOrder.notes}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleEdit}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#111111',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
          >
            ✓ Add to Cart
          </button>
          <button
            onClick={handleRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fee2e2';
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #ef4444',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>❌</div>
        <h3 style={{ margin: '0 0 8px', color: '#dc2626', fontSize: '16px', fontWeight: '600' }}>
          Error
        </h3>
        <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ef4444';
            }}
          >
            🔄 Retry
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#111111',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default VoiceOrderRecorder;
