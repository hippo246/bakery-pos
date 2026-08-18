import React, { useEffect, useState } from 'react';
import BrewCRM from "./components/BrewCRM";
import QROrdering from "./components/qrodering/QROrdering";
import OnlineOrderingPortal from "./components/onlineordering/OnlineOrderingPortal";
import { TerminalProvider } from "./terminal/TerminalContext.jsx";
import { THEME_CSS } from "./styles/theme";
import ErrorBoundary from "./components/common/ErrorBoundary";

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

export default function App() {
  const [isQROrdering, setIsQROrdering] = useState(false);
  const [isOnlineOrdering, setIsOnlineOrdering] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  // Check if we're in QR ordering mode or online ordering mode based on URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    if (params.has('table') || pathname.includes('qr-order')) {
      setIsQROrdering(true);
      // Load menu items for QR ordering
      try {
        const storedMenu = localStorage.getItem('brewcrm_local_menuItems');
        if (storedMenu) {
          setMenuItems(JSON.parse(storedMenu));
        }
      } catch (e) {
        console.error('Failed to load menu items:', e);
      }
    } else if (pathname.includes('online-order') || pathname.includes('order')) {
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

  // Inject theme CSS variables
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("cafe-theme-css")) {
      const el = document.createElement("style");
      el.id = "cafe-theme-css";
      el.textContent = THEME_CSS;
      document.head.appendChild(el);
      return () => el.remove();
    }
  }, []);

  // Global error handler for errors outside React
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error);
      // Log to localStorage
      try {
        const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
        errorLog.push({
          timestamp: new Date().toISOString(),
          message: event.error?.message || 'Unknown error',
          stack: event.error?.stack,
          source: 'global',
          userAgent: navigator.userAgent
        });
        if (errorLog.length > 50) errorLog.shift();
        localStorage.setItem('cafeos_error_log', JSON.stringify(errorLog));
      } catch (_e) {
        // Ignore localStorage errors
      }
      
      // For critical errors, show a simple alert and reload
      if (event.error && event.error.message) {
        console.error('Critical error, reloading page...');
        setTimeout(() => window.location.reload(), 1000);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <TerminalProvider>
        {isQROrdering ? (
          <QROrdering menuItems={menuItems} />
        ) : isOnlineOrdering ? (
          <OnlineOrderingPortal />
        ) : (
          <BrewCRM />
        )}
      </TerminalProvider>
    </ErrorBoundary>
  );
}
