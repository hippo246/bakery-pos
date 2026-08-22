import React, { useState, useEffect } from 'react';
import textToSpeechService from '../../services/voice/TextToSpeechService';

/**
 * Reusable SpeakButton component for text-to-speech
 * Provides play, stop, pause, resume controls with visual feedback
 */
function SpeakButton({ 
  text, 
  onGenerateText, 
  icon = '🔊', 
  size = 'medium',
  position = 'right',
  disabled = false,
  className = ''
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const sizeStyles = {
    small: { width: '28px', height: '28px', fontSize: '12px' },
    medium: { width: '36px', height: '36px', fontSize: '14px' },
    large: { width: '44px', height: '44px', fontSize: '16px' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  const handleSpeak = () => {
    const speechText = onGenerateText ? onGenerateText() : text;
    if (!speechText) return;

    const success = textToSpeechService.speak(speechText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onPause: () => setIsPaused(true),
      onResume: () => setIsPaused(false)
    });

    if (!success) {
      console.warn('Speech synthesis not supported');
    }
  };

  const handleStop = () => {
    textToSpeechService.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (isPaused) {
      textToSpeechService.resume();
      setIsPaused(false);
    } else {
      textToSpeechService.pause();
      setIsPaused(true);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      textToSpeechService.cancel();
    };
  }, []);

  if (!textToSpeechService.isSupported()) {
    return null;
  }

  return (
    <div 
      className={`speak-button-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Main speak button */}
      <button
        onClick={isSpeaking ? handleStop : handleSpeak}
        disabled={disabled}
        style={{
          ...currentSize,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isSpeaking ? '#ef4444' : '#3b82f6',
          color: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: currentSize.fontSize,
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          boxShadow: isSpeaking ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
        }}
        title={isSpeaking ? 'Stop' : 'Read aloud'}
      >
        {isSpeaking ? (isPaused ? '▶️' : '⏸️') : icon}
      </button>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            animation: 'pulse 1s infinite'
          }}
        />
      )}

      {/* Extended controls */}
      {showControls && isSpeaking && (
        <div
          style={{
            position: 'absolute',
            [position]: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: position === 'right' ? '8px' : 0,
            marginRight: position === 'left' ? '8px' : 0,
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 1000
          }}
        >
          <button
            onClick={handlePause}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4b5563',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={handleStop}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Stop"
          >
            ⏹️
          </button>
        </div>
      )}

      {/* Settings button */}
      <button
        onClick={toggleControls}
        style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#6b7280',
          color: 'white',
          cursor: 'pointer',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Settings"
      >
        ⚙️
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default SpeakButton;
