/**
 * Sidebar Dropdown Component
 * 
 * Collapsible dropdown for sidebar footer with role, theme, search, and other settings
 */

import React, { useState } from 'react';
import NotificationBell from '../notifications/NotificationBell';

export default function SidebarDropdown({
  role,
  setRole,
  isOpen,
  setIsOpen,
  theme,
  toggleTheme,
  setCommandPaletteOpen,
  notifications,
  setNotifications,
  onNavigateToInbox,
  isDemoMode,
  exitDemoMode,
  safeSetTab,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleThemeChange = (e) => {
    localStorage.setItem('cafeos-pos-theme', e.target.value);
    window.location.reload();
  };

  const currentTheme = localStorage.getItem('cafeos-pos-theme') || 'modern';
  const currentMode = theme?.mode || 'light';

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 'var(--cafe-radius-md)',
          border: '1px solid var(--cafe-border)',
          background: 'var(--cafe-bg-surface)',
          color: 'var(--cafe-text-secondary)',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚙️</span>
          <span>Settings</span>
        </div>
        <span style={{ 
          fontSize: 10, 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>▼</span>
      </button>

      {/* Dropdown Content */}
      {isExpanded && (
        <div style={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px',
          borderRadius: 'var(--cafe-radius-md)',
          background: 'var(--cafe-bg-card)',
          border: '1px solid var(--cafe-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {/* Role Switcher */}
          {typeof setRole === 'function' && (
            <div>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 600, 
                color: 'var(--cafe-text-tertiary)', 
                letterSpacing: '0.07em', 
                textTransform: 'uppercase', 
                marginBottom: 6 
              }}>
                Active Role
              </div>
              <select
                value={role || 'owner'}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%', fontSize: 12,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-secondary)',
                  padding: '8px 10px', borderRadius: 'var(--cafe-radius-md)',
                  border: '1px solid var(--cafe-border)',
                  cursor: 'pointer', height: 36,
                  fontWeight: 500,
                }}
              >
                <option value="owner">👑 Owner</option>
                <option value="manager">🏢 Manager</option>
                <option value="staff">🧑‍💼 Staff</option>
                <option value="cashier">💰 Cashier</option>
                <option value="kitchen">👨‍🍳 Kitchen</option>
              </select>
            </div>
          )}

          {/* Theme Switcher */}
          <div>
            <div style={{ 
              fontSize: 10, 
              fontWeight: 600, 
              color: 'var(--cafe-text-tertiary)', 
              letterSpacing: '0.07em', 
              textTransform: 'uppercase', 
              marginBottom: 6 
            }}>
              Theme
            </div>
            <select
              value={currentTheme}
              onChange={handleThemeChange}
              style={{
                width: '100%', fontSize: 12,
                background: 'var(--cafe-bg-surface)',
                color: 'var(--cafe-text-secondary)',
                padding: '8px 10px', borderRadius: 'var(--cafe-radius-md)',
                border: '1px solid var(--cafe-border)',
                cursor: 'pointer', height: 36,
                fontWeight: 500,
              }}
            >
              <option value="modern">🎨 Modern</option>
              <option value="modern-light">🌅 Modern Light</option>
              <option value="classic">📟 Classic POS</option>
              <option value="classic-dark">🌙 Classic Dark</option>
              <option value="fastfood">🍔 Fast Food</option>
              <option value="cafe">☕ Cafe</option>
              <option value="finedining">🍽️ Fine Dining</option>
              <option value="bar">🍸 Bar</option>
              <option value="bakery">🥐 Bakery</option>
              <option value="accessibility">♿ Accessibility</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              width: '100%', fontSize: 11,
              background: 'var(--cafe-bg-surface)',
              color: 'var(--cafe-text-secondary)',
              padding: '10px 12px', borderRadius: 'var(--cafe-radius-md)',
              border: '1px solid var(--cafe-border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 500, letterSpacing: '0.04em', transition: 'all 0.15s ease', height: 40,
            }}
          >
            <span style={{ fontSize: 14 }}>🔍</span>
            <span>Search...</span>
            <kbd style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 4 }}>⌘K</kbd>
          </button>

          {/* Exit Demo Button */}
          {isDemoMode && isDemoMode() && (
            <button
              onClick={() => {
                if (confirm('Exit demo mode and switch to production? This will clear demo data.')) {
                  exitDemoMode();
                  window.location.reload();
                }
              }}
              style={{
                width: '100%', fontSize: 11,
                background: 'var(--cafe-danger-bg)',
                color: 'var(--cafe-danger)',
                padding: '10px 12px', borderRadius: 'var(--cafe-radius-md)',
                border: '1px solid var(--cafe-danger-border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontWeight: 600, letterSpacing: '0.04em', transition: 'all 0.15s ease', height: 40,
              }}
            >
              <span style={{ fontSize: 14 }}>🚪</span>
              <span>Exit Demo</span>
            </button>
          )}

          {/* Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NotificationBell 
              notifications={notifications} 
              setNotifications={setNotifications}
              onNavigateToInbox={onNavigateToInbox}
            />
          </div>

          {/* Open/Closed Toggle */}
          <button
            onClick={() => setIsOpen(o => !o)}
            aria-label={isOpen ? 'Mark cafe as closed' : 'Mark cafe as open'}
            aria-pressed={isOpen}
            style={{
              width: '100%', fontSize: 11,
              background: isOpen ? 'var(--cafe-success-bg)' : 'var(--cafe-danger-bg)',
              color: isOpen ? 'var(--cafe-success)' : 'var(--cafe-danger)',
              padding: '10px 12px', borderRadius: 'var(--cafe-radius-md)',
              border: `1px solid ${isOpen ? 'var(--cafe-success-border)' : 'var(--cafe-danger-border)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600, letterSpacing: '0.04em', transition: 'all 0.15s ease', height: 40,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isOpen ? 'var(--cafe-success)' : 'var(--cafe-danger)',
              boxShadow: `0 0 8px ${isOpen ? 'var(--cafe-success)' : 'var(--cafe-danger)'}`,
              flexShrink: 0,
            }} />
            {isOpen ? 'Open Now' : 'Closed'}
          </button>

          {/* Light/Dark Mode Toggle */}
          <button
            onClick={() => typeof toggleTheme === 'function' && toggleTheme()}
            aria-label={`Switch to ${currentMode === 'dark' ? 'light' : 'dark'} theme`}
            style={{
              width: '100%', fontSize: 11,
              background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-secondary)',
              padding: '10px 12px', borderRadius: 'var(--cafe-radius-md)',
              border: '1px solid var(--cafe-border-light)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 500, letterSpacing: '0.02em', transition: 'all 0.15s ease', height: 40,
            }}
          >
            <span style={{ fontSize: 13 }}>{currentMode === 'dark' ? '◐' : '◑'}</span>
            {currentMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      )}
    </div>
  );
}
