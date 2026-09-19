import { useState, useEffect } from 'react';

/**
 * Hook to get and apply app settings (currency, language, etc.)
 * This hook reads from localStorage and provides the current settings
 */
export function useAppSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cafeos_settings');
      return saved ? JSON.parse(saved) : getDefaultSettings();
    } catch (e) {
      return getDefaultSettings();
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('cafeos_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes from same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return settings;
}

function getDefaultSettings() {
  return {
    currency: 'INR',
    language: 'en',
    numberFormat: 'indian',
    decimalPlaces: 2,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Asia/Kolkata'
  };
}
