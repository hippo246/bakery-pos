// Notification Sound Service
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

// Audio context for playing sounds
let audioContext = null;
let lastPlayedTime = 0;
const MIN_PLAY_INTERVAL = 1000; // Minimum 1 second between sounds

// Initialize audio context
const initAudioContext = () => {
  if (typeof window === "undefined") return null;
  
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  return audioContext;
};

// Play notification sound
export const playNotificationSound = (type = 'normal', volume = 0.7) => {
  if (typeof window === "undefined") return;
  
  const config = localStorage.getItem('cafeos_notification_settings');
  const settings = config ? JSON.parse(config) : null;
  
  // Check if sound is enabled
  if (settings && !settings.sound.enabled) return;
  
  // Check if urgent only and this is not urgent
  if (settings && settings.sound.urgentOnly && type !== 'urgent') return;
  
  // Rate limiting - prevent sound spam
  const now = Date.now();
  if (now - lastPlayedTime < MIN_PLAY_INTERVAL) return;
  
  try {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // For now, use a simple beep as placeholder
    // In production, this would load and play actual sound files
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different tones for different notification types
    switch (type) {
      case 'urgent':
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        break;
      case 'kitchen':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        break;
      case 'waiter':
        oscillator.frequency.value = 700;
        oscillator.type = 'triangle';
        break;
      case 'payment':
        oscillator.frequency.value = 500;
        oscillator.type = 'sine';
        break;
      default:
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
    }
    
    const actualVolume = safeNum(settings?.sound.volume, volume);
    gainNode.gain.value = actualVolume * 0.3; // Reduce overall volume
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
    
    lastPlayedTime = now;
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
};

// Test sound
export const testSound = (type = 'normal') => {
  playNotificationSound(type, 1.0);
};

// Check if sound can be played
export const canPlaySound = () => {
  if (typeof window === "undefined") return false;
  
  const config = localStorage.getItem('cafeos_notification_settings');
  const settings = config ? JSON.parse(config) : null;
  
  return settings?.sound.enabled ?? true;
};
