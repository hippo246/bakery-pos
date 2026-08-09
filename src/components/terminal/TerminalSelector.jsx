import React, { useState } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import { useTerminal } from '../../terminal/TerminalContext.jsx';

const TERMINAL_TYPES = [
  { id: 'pos', name: 'POS Terminal', icon: '🖥️', description: 'Point of Sale terminal for taking orders' },
  { id: 'kds', name: 'Kitchen Display', icon: '👨‍🍳', description: 'Kitchen display system for order management' },
  { id: 'admin', name: 'Admin Terminal', icon: '⚙️', description: 'Administrative terminal for management' }
];

const LOCATIONS = [
  { id: 'main', name: 'Main Floor' },
  { id: 'outdoor', name: 'Outdoor Seating' },
  { id: 'bar', name: 'Bar Area' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'office', name: 'Office' }
];

export default function TerminalSelector({ onClose, onTerminalSelected }) {
  const { currentTerminal, allTerminals, selectTerminal, createTerminal, isConnected } = useTerminal();
  const [mode, setMode] = useState('select'); // 'select' or 'create'
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState({
    name: '',
    type: 'pos',
    location: 'main',
    defaultOrderType: 'dine_in'
  });

  const handleSelectTerminal = async (terminal) => {
    try {
      await selectTerminal(terminal.id);
      if (onTerminalSelected) {
        onTerminalSelected(terminal);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to select terminal:', error);
      setAlertDialog({ isOpen: true, title: 'Selection Failed', message: 'Failed to select terminal: ' + error.message, type: 'error' });
    }
  };

  const handleCreateTerminal = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setAlertDialog({ isOpen: true, title: 'Validation Error', message: 'Please enter a terminal name', type: 'error' });
      return;
    }

    try {
      const newTerminal = createTerminal({
        name: formData.name,
        type: formData.type,
        location: formData.location,
        defaultOrderType: formData.defaultOrderType
      });

      await selectTerminal(newTerminal.id);
      
      if (onTerminalSelected) {
        onTerminalSelected(newTerminal);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
      setAlertDialog({ isOpen: true, title: 'Creation Failed', message: 'Failed to create terminal: ' + error.message, type: 'error' });
    }
  };

  const isOnline = (terminal) => {
    const lastSeen = terminal.lastSeen || 0;
    const offlineThreshold = 30000; // 30 seconds
    return (Date.now() - lastSeen) < offlineThreshold;
  };

  if (mode === 'create') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 16,
          padding: 24,
          width: '90%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', margin: 0 }}>
              Create New Terminal
            </h2>
            <button
              onClick={() => setMode('select')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: 'var(--cafe-text-secondary)'
              }}
            >
              ←
            </button>
          </div>

          <form onSubmit={handleCreateTerminal}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>
                Terminal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., POS Terminal 1"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  background: 'var(--cafe-bg)',
                  color: 'var(--cafe-text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>
                Terminal Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {TERMINAL_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    style={{
                      padding: 12,
                      border: formData.type === type.id ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                      borderRadius: 8,
                      background: formData.type === type.id ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{type.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>
                Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  background: 'var(--cafe-bg)',
                  color: 'var(--cafe-text-primary)',
                  outline: 'none'
                }}
              >
                {LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>
                Default Order Type
              </label>
              <select
                value={formData.defaultOrderType}
                onChange={(e) => setFormData({ ...formData, defaultOrderType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  background: 'var(--cafe-bg)',
                  color: 'var(--cafe-text-primary)',
                  outline: 'none'
                }}
              >
                <option value="dine_in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setMode('select')}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--cafe-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Create Terminal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', margin: 0 }}>
            Select Terminal
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: 'var(--cafe-text-secondary)'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {currentTerminal && (
          <div style={{
            background: 'var(--cafe-accent-bg)',
            border: '1px solid var(--cafe-accent)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isOnline(currentTerminal) ? '#10b981' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                {isOnline(currentTerminal) ? '✓' : '○'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                  {currentTerminal.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                  {currentTerminal.type.toUpperCase()} • {currentTerminal.location}
                </div>
              </div>
              <div style={{ fontSize: 12, color: isOnline(currentTerminal) ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {isOnline(currentTerminal) ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', margin: 0 }}>
              Available Terminals
            </h3>
            <button
              onClick={() => setMode('create')}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              + New Terminal
            </button>
          </div>

          {allTerminals.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--cafe-text-tertiary)',
              background: 'var(--cafe-bg)',
              borderRadius: 8,
              border: '1px dashed var(--cafe-border)'
            }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🖥️</span>
              <p style={{ fontSize: 14, margin: 0 }}>
                No terminals configured. Create your first terminal to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {allTerminals.map(terminal => (
                <button
                  key={terminal.id}
                  onClick={() => handleSelectTerminal(terminal)}
                  disabled={currentTerminal?.id === terminal.id}
                  style={{
                    padding: 16,
                    background: currentTerminal?.id === terminal.id ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg)',
                    border: currentTerminal?.id === terminal.id ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                    borderRadius: 8,
                    cursor: currentTerminal?.id === terminal.id ? 'default' : 'pointer',
                    textAlign: 'left',
                    opacity: currentTerminal?.id === terminal.id ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isOnline(terminal) ? '#10b981' : '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>
                      {isOnline(terminal) ? '✓' : '○'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                        {terminal.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                        {terminal.type.toUpperCase()} • {terminal.location}
                      </div>
                    </div>
                    {currentTerminal?.id === terminal.id && (
                      <span style={{ fontSize: 12, color: 'var(--cafe-accent)', fontWeight: 600 }}>
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {isConnected && (
          <div style={{
            padding: 12,
            background: '#10b98120',
            border: '1px solid #10b981',
            borderRadius: 8,
            fontSize: 13,
            color: '#10b981',
            textAlign: 'center'
          }}>
            ✓ Connected to sync server
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
