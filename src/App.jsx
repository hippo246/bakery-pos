import React, { useEffect, useState } from 'react';
import BrewCRM from "./components/BrewCRM";
import OnlineOrderingPortal from "./components/onlineordering/OnlineOrderingPortal";
import { TerminalProvider } from "./terminal/TerminalContext.jsx";
import { THEME_CSS } from "./styles/theme";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { getStorageAdapter } from "./storage/StorageAdapter.js";

// Add smooth transitions for theme switching
if (typeof document !== "undefined" && !document.getElementById("brew-theme-transitions")) {
  const el = document.createElement("style");
  el.id = "brew-theme-transitions";
  el.textContent = "* { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }";
  document.head.appendChild(el);

  try {
    console.log(
      "%c☕ BrewCRM booted — go make someone's day a little more caffeinated.",
      "color:#8b6914;font-weight:bold;font-size:12px;"
    );
  } catch { /* console unavailable */ }
}

// Inject the CSS custom-property theme tokens so --cafe-bg, --cafe-border, etc. are defined.
// This runs once at module load time (before any React render) for zero-flash theming.
if (typeof document !== "undefined" && !document.getElementById("brew-theme-css")) {
  const el = document.createElement("style");
  el.id = "brew-theme-css";
  el.textContent = THEME_CSS;
  document.head.appendChild(el);
}

// Apply the correct theme class to <html> based on saved preference, before first paint.
if (typeof document !== "undefined") {
  const saved = localStorage.getItem('bakerypos_theme');
  // "light" saved means darkMode===true (light mode) — apply .light class
  if (saved === 'light' || saved === null) {
    // Default to light mode for new users (matches the default in BakeryPOS: true = light)
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

export default function App() {
  const [isOnlineOrdering, setIsOnlineOrdering] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [storageInitialized, setStorageInitialized] = useState(false);

  // Initialize high-capacity storage system with failover
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const storageAdapter = getStorageAdapter({
          useIndexedDB: true,
          enableSync: true,
          enableFailover: true
        });
        
        await storageAdapter.initialize();
        
        // Subscribe to failover events
        storageAdapter.subscribe('storageSwitched', (data) => {
          console.log('[App] Storage switched:', data);
          // Could show a notification to user here
        });
        
        storageAdapter.subscribe('healthCheck', (health) => {
          if (!health.healthy) {
            console.warn('[App] Storage health check failed:', health.error);
          }
        });
        
        // Log storage statistics
        const stats = await storageAdapter.getStats();
        console.log('[App] Storage initialized with failover:', stats);
        
        setStorageInitialized(true);
      } catch (error) {
        console.error('[App] Storage initialization failed:', error);
        // Continue with LocalStorage fallback
        setStorageInitialized(true);
      }
    };

    initializeStorage();
  }, []);

  // Check if we're in online ordering mode based on URL
  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname.includes('online-order') || pathname.includes('order')) {
      setIsOnlineOrdering(true);
      // Load menu items for online ordering
      try {
        const storedMenu = localStorage.getItem('brewcrm_local_menuItems');
        if (storedMenu) {
          setMenuItems(JSON.parse(storedMenu));
        }
      } catch (e) {
        console.error('Failed to load menu items:', e);
      }
    }
  }, []);

  // Redirect QR ordering to the HTML file
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    if (params.has('table') || pathname.includes('qr-order')) {
      // Redirect to the HTML QR ordering page
      window.location.href = '/qr-ordering.html' + (params.toString() ? '?' + params.toString() : '');
    }
  }, []);

  // Global error handler for errors outside React
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error);
      
      // Enhanced error logging with more details
      try {
        const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
        const errorDetails = {
          timestamp: new Date().toISOString(),
          message: event.error?.message || 'Unknown error',
          stack: event.error?.stack,
          source: 'global',
          userAgent: navigator.userAgent,
          url: window.location.href,
          browserInfo: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            platform: navigator.platform,
            language: navigator.language
          },
          systemInfo: {
            memory: navigator.deviceMemory,
            cores: navigator.hardwareConcurrency,
            connection: navigator.connection?.effectiveType,
            onLine: navigator.onLine
          },
          severity: event.error?.message?.includes('Critical') ? 'critical' : 'error',
          frequency: getErrorFrequency(event.error?.message)
        };
        
        errorLog.push(errorDetails);
        if (errorLog.length > 100) errorLog.shift();
        localStorage.setItem('cafeos_error_log', JSON.stringify(errorLog));
        
        // Update crash statistics
        updateCrashStats(errorDetails);
      } catch (_e) {
        console.error('Failed to log error:', _e);
      }
      
      // Show enhanced error dialog with recovery options
      if (event.error && event.error.message) {
        showErrorDialog(event.error);
      }
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      try {
        const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
        const errorDetails = {
          timestamp: new Date().toISOString(),
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          source: 'promise',
          userAgent: navigator.userAgent,
          url: window.location.href,
          browserInfo: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            platform: navigator.platform,
            language: navigator.language
          },
          severity: 'warning',
          frequency: getErrorFrequency(event.reason?.message)
        };
        
        errorLog.push(errorDetails);
        if (errorLog.length > 100) errorLog.shift();
        localStorage.setItem('cafeos_error_log', JSON.stringify(errorLog));
        
        updateCrashStats(errorDetails);
      } catch (_e) {
        console.error('Failed to log rejection:', _e);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Helper functions for enhanced error handling
  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Brave')) return 'Brave';
    return 'Unknown';
  };

  const getBrowserVersion = () => {
    const ua = navigator.userAgent;
    const match = ua.match(/(Chrome|Firefox|Safari|Edge|Brave)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  };

  const getErrorFrequency = (errorMessage) => {
    try {
      const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
      const sameErrors = errorLog.filter(e => e.message === errorMessage);
      return sameErrors.length;
    } catch {
      return 1;
    }
  };

  const updateCrashStats = (errorDetails) => {
    try {
      const stats = JSON.parse(localStorage.getItem('cafeos_crash_stats') || '{}');
      stats.totalErrors = (stats.totalErrors || 0) + 1;
      stats.lastError = errorDetails.timestamp;
      stats.errorTypes = stats.errorTypes || {};
      const errorType = errorDetails.message.split(':')[0] || 'unknown';
      stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
      stats.browserErrors = stats.browserErrors || {};
      stats.browserErrors[errorDetails.browserInfo.name] = (stats.browserErrors[errorDetails.browserInfo.name] || 0) + 1;
      localStorage.setItem('cafeos_crash_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to update crash stats:', e);
    }
  };

  const showErrorDialog = (error) => {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    dialog.innerHTML = `
      <div style="background: white; padding: 32px; border-radius: 12px; max-width: 500px; width: 90%;">
        <h2 style="margin: 0 0 16px 0; color: #dc2626;">⚠️ Error Occurred</h2>
        <p style="margin: 0 0 16px 0; color: #374151; line-height: 1.6;">
          ${error.message}
        </p>
        <div style="margin-bottom: 24px; padding: 16px; background: #fef2f2; border-radius: 8px; font-size: 13px; color: #991b1b;">
          <strong>Error Details:</strong><br>
          Browser: ${getBrowserName()} ${getBrowserVersion()}<br>
          Platform: ${navigator.platform}<br>
          Time: ${new Date().toLocaleString()}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button id="retry-btn" style="flex: 1; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            🔄 Retry
          </button>
          <button id="refresh-btn" style="flex: 1; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            🔄 Refresh Page
          </button>
          <button id="cache-btn" style="flex: 1; padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            🗑️ Clear Cache
          </button>
          <button id="dismiss-btn" style="flex: 1; padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            ✕ Dismiss
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('#retry-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
      // Try to recover by reloading the current route
      window.location.reload();
    });
    
    dialog.querySelector('#refresh-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
      window.location.reload();
    });
    
    dialog.querySelector('#cache-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
      clearBrowserCache();
    });
    
    dialog.querySelector('#dismiss-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  };

  const clearBrowserCache = () => {
    try {
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
      // Clear caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      // Reload page
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear cache:', e);
      alert('Failed to clear cache. Please clear manually in browser settings.');
    }
  };

  return (
    <ErrorBoundary>
      <TerminalProvider>
        {!storageInitialized ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#1a1a2e',
            color: '#e0e0e0',
            fontSize: '18px'
          }}>
            Initializing storage system...
          </div>
        ) : isOnlineOrdering ? (
          <OnlineOrderingPortal />
        ) : (
          <BrewCRM />
        )}
      </TerminalProvider>
    </ErrorBoundary>
  );
}
