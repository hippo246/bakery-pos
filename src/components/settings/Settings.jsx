import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';
import useScreenSize from '../../hooks/useScreenSize';
import ReceiptStudioPanel from './panels/ReceiptStudioPanel';
import WorkflowEnginePanel from './panels/WorkflowEnginePanel';
import RoleSecurityPanel from './panels/RoleSecurityPanel';

/* ─── Table Management Panel Component ─────────────────────────────── */
function TableManagementPanel({ tables, setTables, darkMode, staff = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reducer for modal and form state
  const tableManagementReducer = (state, action) => {
    switch (action.type) {
      case 'OPEN_ADD_MODAL':
        return {
          ...state,
          showModal: true,
          mode: 'add',
          editingTable: null,
          formData: { 
            name: '', 
            capacity: 4,
            location: '',
            shape: 'rectangular',
            tableType: 'indoor',
            minPartySize: 1,
            maxPartySize: 20,
            notes: '',
            qrEnabled: true
          },
          formAlert: ''
        };
      case 'OPEN_EDIT_MODAL':
        return {
          ...state,
          showModal: true,
          mode: 'edit',
          editingTable: action.payload.table,
          formData: { 
            name: action.payload.table.name, 
            capacity: action.payload.table.capacity,
            location: action.payload.table.location || '',
            shape: action.payload.table.shape || 'rectangular',
            tableType: action.payload.table.tableType || 'indoor',
            minPartySize: action.payload.table.minPartySize || 1,
            maxPartySize: action.payload.table.maxPartySize || 20,
            notes: action.payload.table.notes || '',
            qrEnabled: action.payload.table.qrEnabled !== false
          },
          formAlert: ''
        };
      case 'CLOSE_MODAL':
        return {
          ...state,
          showModal: false,
          mode: 'add',
          editingTable: null,
          formData: { 
            name: '', 
            capacity: 4,
            location: '',
            shape: 'rectangular',
            tableType: 'indoor',
            minPartySize: 1,
            maxPartySize: 20,
            notes: '',
            qrEnabled: true
          },
          formAlert: ''
        };
      case 'UPDATE_FORM_DATA':
        return {
          ...state,
          formData: { ...state.formData, ...action.payload }
        };
      case 'SET_FORM_ALERT':
        return {
          ...state,
          formAlert: action.payload
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(tableManagementReducer, {
    showModal: false,
    mode: 'add',
    editingTable: null,
    formData: { 
      name: '', 
      capacity: 4,
      location: '',
      shape: 'rectangular',
      tableType: 'indoor',
      minPartySize: 1,
      maxPartySize: 20,
      notes: '',
      qrEnabled: true
    },
    formAlert: ''
  });

  const t = {
    bg:       darkMode ? '#000000' : '#f5f7fa',
    bgEle:    darkMode ? '#0a0a0a' : '#ffffff',
    bgCard:   darkMode ? '#111111' : '#ffffff',
    bgInput:  darkMode ? '#000000' : '#f8fafc',
    border:   darkMode ? '#222222' : '#d1d5db',
    text:     darkMode ? '#ffffff' : '#0a0a0a',
    textSub:  darkMode ? '#e0e0e0' : '#222222',
    textMute: darkMode ? '#888888' : '#6b7280',
    accent:   '#6366f1',
  };

  const handleSaveTable = async () => {
    if (isSubmitting) return;
    
    if (!state.formData.name.trim()) {
      dispatch({ type: 'SET_FORM_ALERT', payload: 'Table name is required' });
      return;
    }
    if (state.formData.capacity < 1 || state.formData.capacity > 20) {
      dispatch({ type: 'SET_FORM_ALERT', payload: 'Capacity must be between 1 and 20' });
      return;
    }
    if (state.formData.minPartySize < 1 || state.formData.minPartySize > state.formData.capacity) {
      dispatch({ type: 'SET_FORM_ALERT', payload: 'Minimum party size must be between 1 and capacity' });
      return;
    }
    if (state.formData.maxPartySize < state.formData.capacity || state.formData.maxPartySize > 50) {
      dispatch({ type: 'SET_FORM_ALERT', payload: 'Maximum party size must be at least capacity and max 50' });
      return;
    }

    // Check if table is occupied and capacity is being reduced below seated guest count
    if (state.mode === 'edit' && state.editingTable?.status === 'occupied') {
      const activeOrders = state.editingTable.activeOrders || [];
      const totalGuests = activeOrders.reduce((sum, order) => sum + (order.guestCount || 1), 0);
      if (state.formData.capacity < totalGuests) {
        dispatch({ type: 'SET_FORM_ALERT', payload: `Cannot reduce capacity below seated guests (${totalGuests} guests currently seated)` });
        return;
      }
    }

    setIsSubmitting(true);

    // Small delay to prevent double-click
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      if (state.mode === 'edit') {
        setTables(prev => prev.map(t => 
          t.id === state.editingTable.id 
            ? { 
                ...t, 
                name: state.formData.name.trim(), 
                capacity: state.formData.capacity,
                location: state.formData.location,
                shape: state.formData.shape,
                tableType: state.formData.tableType,
                minPartySize: state.formData.minPartySize,
                maxPartySize: state.formData.maxPartySize,
                notes: state.formData.notes,
                qrEnabled: state.formData.qrEnabled
              }
            : t
        ));
      } else {
        // Use timestamp + random for unique ID to prevent duplicates
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        setTables(prev => [...prev, {
          id: newId,
          name: state.formData.name.trim(),
          capacity: state.formData.capacity,
          status: 'available',
          location: state.formData.location,
          shape: state.formData.shape,
          tableType: state.formData.tableType,
          minPartySize: state.formData.minPartySize,
          maxPartySize: state.formData.maxPartySize,
          notes: state.formData.notes,
          qrEnabled: state.formData.qrEnabled
        }]);
      }

      dispatch({ type: 'CLOSE_MODAL' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = (tableId) => {
    if (confirm('Are you sure you want to delete this table? This will also remove all related data including reservations and session history.')) {
      // Clean up related data before deleting
      const tableIdStr = String(tableId);
      
      // Clean up occupiedSince entries
      try {
        const occupiedSince = JSON.parse(localStorage.getItem('tables_occupied_since') || '{}');
        delete occupiedSince[tableIdStr];
        localStorage.setItem('tables_occupied_since', JSON.stringify(occupiedSince));
      } catch (e) { console.error('Error cleaning up occupiedSince:', e); }
      
      // Clean up reservations for this table
      try {
        const reservations = JSON.parse(localStorage.getItem('cafeos_reservations') || '[]');
        const updatedReservations = reservations.filter(r => String(r.tableId) !== tableIdStr);
        localStorage.setItem('cafeos_reservations', JSON.stringify(updatedReservations));
      } catch (e) { console.error('Error cleaning up reservations:', e); }
      
      // Clean up waiter calls for this table
      try {
        const waiterCalls = JSON.parse(localStorage.getItem('cafeos_waiter_calls') || '[]');
        const updatedCalls = waiterCalls.filter(c => c.tableId !== tableIdStr);
        localStorage.setItem('cafeos_waiter_calls', JSON.stringify(updatedCalls));
      } catch (e) { console.error('Error cleaning up waiter calls:', e); }
      
      // Clean up session history for this table
      try {
        const sessions = JSON.parse(localStorage.getItem('tables_sessions_history') || '{}');
        Object.keys(sessions).forEach(sessionId => {
          if (sessions[sessionId].tableId === tableId) {
            delete sessions[sessionId];
          }
        });
        localStorage.setItem('tables_sessions_history', JSON.stringify(sessions));
      } catch (e) { console.error('Error cleaning up session history:', e); }
      
      // Delete the table
      setTables(prev => prev.filter(t => t.id !== tableId));
    }
  };

  const handleEditTable = (table) => {
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: { table } });
  };

  const getShapeIcon = (shape) => {
    const icons = { rectangular: '▭', round: '⭕', square: '⬜', oval: '⬭' };
    return icons[shape] || '▭';
  };

  const getTypeIcon = (type) => {
    const icons = { indoor: '🏠', outdoor: '🌳', private: '🔒', bar: '🍸', vip: '⭐' };
    return icons[type] || '🏠';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add Table Button */}
      <button
        onClick={() => dispatch({ type: 'OPEN_ADD_MODAL' })}
        style={{
          padding: '12px 16px',
          background: t.accent,
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}
      >
        ➕ Add New Table
      </button>

      {/* Tables List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {tables.map(table => (
          <div key={table.id} style={{
            padding: '14px',
            background: t.bgCard,
            borderRadius: '8px',
            border: `1px solid ${t.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>{table.name}</span>
              <span style={{ fontSize: '11px', color: t.textMute }}>👥 {table.capacity}</span>
            </div>
            
            {/* Table Details */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', background: t.bgInput, color: t.textMute }}>
                {getShapeIcon(table.shape || 'rectangular')} {(table.shape || 'rectangular').charAt(0).toUpperCase()}
              </span>
              <span style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', background: t.bgInput, color: t.textMute }}>
                {getTypeIcon(table.tableType || 'indoor')} {(table.tableType || 'indoor').charAt(0).toUpperCase()}
              </span>
              {table.location && (
                <span style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', background: t.bgInput, color: t.textMute }}>
                  📍 {table.location}
                </span>
              )}
              {table.qrEnabled !== false && (
                <span style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                  📱 QR
                </span>
              )}
            </div>

            {/* Party Size */}
            {(table.minPartySize || table.maxPartySize) && (
              <div style={{ fontSize: '10px', color: t.textMute }}>
                Party: {table.minPartySize || 1}-{table.maxPartySize || table.capacity}
              </div>
            )}

            {/* Status */}
            <div style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              padding: '4px 8px', 
              borderRadius: '4px',
              background: table.status === 'occupied' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: table.status === 'occupied' ? '#f59e0b' : '#22c55e',
              width: 'fit-content'
            }}>
              {table.status.toUpperCase()}
            </div>

            {/* Notes Preview */}
            {table.notes && (
              <div style={{ fontSize: '10px', color: t.textMute, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {table.notes}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => handleEditTable(table)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: t.bgInput,
                  color: t.text,
                  border: `1px solid ${t.border}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTable(table.id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: t.textMute,
          fontSize: '14px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🪑</div>
          No tables configured. Add your first table to get started.
        </div>
      )}

      {/* Add/Edit Modal */}
      {state.showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'CLOSE_MODAL' }); }}
        >
          <div style={{
            background: t.bgEle,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: `1px solid ${t.border}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: t.text }}>
                {state.mode === 'edit' ? '✏️ Edit Table' : '➕ Add Table'}
              </div>
              <button
                onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                style={{ width: '32px', height: '32px', background: t.bgInput, border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: t.text }}
              >
                ×
              </button>
            </div>

            {state.formAlert && (
              <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
                ⚠️ {state.formAlert}
              </div>
            )}

            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Table Name *
                </label>
                <input
                  type="text"
                  value={state.formData.name}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { name: e.target.value } })}
                  placeholder="e.g. T9"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Capacity *
                </label>
                <input
                  type="number"
                  value={state.formData.capacity}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { capacity: parseInt(e.target.value) || 1 } })}
                  min="1"
                  max="20"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                Location / Area
              </label>
              <input
                type="text"
                value={state.formData.location}
                onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { location: e.target.value } })}
                placeholder="e.g. Main Hall, Patio"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: t.bgInput,
                  color: t.text,
                  outline: 'none'
                }}
              />
            </div>

            {/* Shape & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Shape
                </label>
                <select
                  value={state.formData.shape}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { shape: e.target.value } })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="rectangular">Rectangular</option>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="oval">Oval</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Type
                </label>
                <select
                  value={state.formData.tableType}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { tableType: e.target.value } })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="private">Private Room</option>
                  <option value="bar">Bar Area</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            {/* Party Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Min Party Size
                </label>
                <input
                  type="number"
                  value={state.formData.minPartySize}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { minPartySize: parseInt(e.target.value) || 1 } })}
                  min="1"
                  max={state.formData.capacity}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                  Max Party Size
                </label>
                <input
                  type="number"
                  value={state.formData.maxPartySize}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { maxPartySize: parseInt(e.target.value) || 20 } })}
                  min={state.formData.capacity}
                  max="50"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: t.bgInput,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
                Notes
              </label>
              <textarea
                value={state.formData.notes}
                onChange={(e) => dispatch({ type: 'UPDATE_FORM_DATA', payload: { notes: e.target.value } })}
                placeholder="Special instructions, proximity to kitchen, etc."
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: t.bgInput,
                  color: t.text,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* QR Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: t.bgInput, borderRadius: '8px', border: `1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: t.text }}>Enable QR Code</div>
                <div style={{ fontSize: '12px', color: t.textMute }}>Allow QR ordering for this table</div>
              </div>
              <div
                onClick={() => dispatch({ type: 'UPDATE_FORM_DATA', payload: { qrEnabled: !state.formData.qrEnabled } })}
                style={{
                  width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
                  background: state.formData.qrEnabled ? '#6366f1' : (darkMode ? '#111111' : '#d1d5db'),
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: state.formData.qrEnabled ? '25px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#ffffff', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                style={{ flex: 1, padding: '12px', background: t.bgInput, color: t.textSub, border: `1px solid ${t.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                disabled={isSubmitting}
                style={{ flex: 1, padding: '12px', background: isSubmitting ? '#9ca3af' : t.accent, color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Saving...' : (state.mode === 'edit' ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Menu Layout Settings Component ─────────────────────────────── */
function MenuLayoutSettings({ menuLayout = {}, onMenuLayoutChange, darkMode = true, screenSize = 'large' }) {
  const currentLayout = {
    viewMode: 'grid',
    gridColumns: 'auto',
    style: 'clean',
    showImages: true,
    showDescriptions: true,
    showCategoryLabels: true,
    showStockBadges: true,
    showVegNonVeg: true,
    spacing: 'medium',
    borderRadius: 'medium',
    shadow: 'subtle',
    ...menuLayout
  };

  const handleLayoutChange = (key, value) => {
    onMenuLayoutChange({ ...currentLayout, [key]: value });
  };

  const t = {
    bg:       darkMode ? '#000000' : '#f5f7fa',
    bgCard:   darkMode ? '#111111' : '#ffffff',
    bgInput:  darkMode ? '#1a1a1a' : '#f9fafb',
    bgEle:    darkMode ? '#0a0a0a' : '#f9fafb',
    text:     darkMode ? '#ffffff' : '#0a0a0a',
    textSub:  darkMode ? '#9ca3af' : '#6b7280',
    textMute: darkMode ? '#6b7280' : '#9ca3af',
    border:   darkMode ? '#222222' : '#e5e7eb',
    accent:   '#6366f1',
  };

  // Style options per view mode
  const viewModeStyles = {
    grid: [
      { value: 'clean', label: 'Clean', desc: 'Simple cards' },
      { value: 'card', label: 'Card', desc: 'With shadow' },
      { value: 'flat', label: 'Flat', desc: 'No shadow' }
    ],
    list: [
      { value: 'row', label: 'Row', desc: 'Horizontal' },
      { value: 'card', label: 'Card', desc: 'Vertical' },
      { value: 'minimal', label: 'Minimal', desc: 'Compact' }
    ],
    compact: [
      { value: 'dense', label: 'Dense', desc: 'Small gaps' },
      { value: 'grid', label: 'Grid', desc: '4 columns' },
      { value: 'list', label: 'List', desc: 'Compact rows' }
    ],
    large: [
      { value: 'showcase', label: 'Showcase', desc: 'Big images' },
      { value: 'featured', label: 'Featured', desc: 'Highlighted' },
      { value: 'simple', label: 'Simple', desc: 'Clean layout' }
    ]
  };

  const currentStyles = viewModeStyles[currentLayout.viewMode] || viewModeStyles.grid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* View Mode */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
          View Mode
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
            { value: 'compact', label: 'Compact' },
            { value: 'large', label: 'Large' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => handleLayoutChange('viewMode', mode.value)}
              style={{
                padding: '12px',
                background: currentLayout.viewMode === mode.value
                  ? 'rgba(99,102,241,0.2)'
                  : t.bgCard,
                border: `1.5px solid ${currentLayout.viewMode === mode.value ? '#6366f1' : t.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: currentLayout.viewMode === mode.value ? '#6366f1' : t.text,
                transition: 'all 0.15s'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style - based on view mode */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
          {currentLayout.viewMode.charAt(0).toUpperCase() + currentLayout.viewMode.slice(1)} Style
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {currentStyles.map(style => (
            <button
              key={style.value}
              onClick={() => handleLayoutChange('style', style.value)}
              style={{
                padding: '12px 8px',
                background: currentLayout.style === style.value
                  ? 'rgba(99,102,241,0.2)'
                  : t.bgCard,
                border: `1.5px solid ${currentLayout.style === style.value ? '#6366f1' : t.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '600', color: currentLayout.style === style.value ? '#6366f1' : t.text }}>
                {style.label}
              </span>
              <span style={{ fontSize: '10px', color: t.textMute }}>
                {style.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Columns - only for grid view */}
      {currentLayout.viewMode === 'grid' && (
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
            Columns
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { value: 'auto', label: 'Auto' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' }
            ].map(col => (
              <button
                key={col.value}
                onClick={() => handleLayoutChange('gridColumns', col.value)}
                style={{
                  padding: '12px',
                  background: currentLayout.gridColumns === col.value
                    ? 'rgba(99,102,241,0.2)'
                    : t.bgCard,
                  border: `1.5px solid ${currentLayout.gridColumns === col.value ? '#6366f1' : t.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: currentLayout.gridColumns === col.value ? '#6366f1' : t.text,
                  transition: 'all 0.15s'
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacing */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
          Spacing
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { value: 'tight', label: 'Tight' },
            { value: 'medium', label: 'Medium' },
            { value: 'loose', label: 'Loose' }
          ].map(spacing => (
            <button
              key={spacing.value}
              onClick={() => handleLayoutChange('spacing', spacing.value)}
              style={{
                padding: '12px',
                background: currentLayout.spacing === spacing.value
                  ? 'rgba(99,102,241,0.2)'
                  : t.bgCard,
                border: `1.5px solid ${currentLayout.spacing === spacing.value ? '#6366f1' : t.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: currentLayout.spacing === spacing.value ? '#6366f1' : t.text,
                transition: 'all 0.15s'
              }}
            >
              {spacing.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
          Border Radius
        </label>
        <select
          value={currentLayout.borderRadius}
          onChange={(e) => handleLayoutChange('borderRadius', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: t.bgInput,
            border: `1px solid ${t.border}`,
            borderRadius: '8px',
            color: t.text,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Shadow */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '8px' }}>
          Shadow
        </label>
        <select
          value={currentLayout.shadow}
          onChange={(e) => handleLayoutChange('shadow', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: t.bgInput,
            border: `1px solid ${t.border}`,
            borderRadius: '8px',
            color: t.text,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="none">None</option>
          <option value="subtle">Subtle</option>
          <option value="medium">Medium</option>
          <option value="strong">Strong</option>
        </select>
      </div>

      {/* Content Display Options */}
      <div style={{ padding: '12px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text, marginBottom: '12px' }}>
          Content Display
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { key: 'showImages', label: 'Show Item Images' },
            { key: 'showDescriptions', label: 'Show Descriptions' },
            { key: 'showCategoryLabels', label: 'Show Category Labels' },
            { key: 'showStockBadges', label: 'Show Stock Badges' },
            { key: 'showVegNonVeg', label: 'Show Veg/Non-Veg Icons' }
          ].map(option => (
            <div key={option.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: t.text }}>{option.label}</span>
              <div
                onClick={() => handleLayoutChange(option.key, !currentLayout[option.key])}
                style={{
                  width: '40px',
                  height: '22px',
                  background: currentLayout[option.key] ? '#10b981' : '#000000',
                  borderRadius: '11px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: currentLayout[option.key] ? '21px' : '3px',
                    width: '16px',
                    height: '16px',
                    background: '#ffffff',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleSettings({ settings = {}, setSettings, onNavigate, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, orders = [], setOrders, staff = [], setStaff, tables = [], setTables, darkMode = true }) {
  const [activeSection, setActiveSection] = useState('general');
  const screenSize = useScreenSize();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const [formData, setFormData] = useState({
    // General Settings
    storeName: settings.storeName || '',
    storeAddress: settings.storeAddress || '',
    phone: settings.phone || '',
    email: settings.email || '',
    gstin: settings.gstin || '',
    panNumber: settings.panNumber || '',
    managerName: settings.managerName || '',
    businessType: settings.businessType || 'restaurant',
    emergencyContact: settings.emergencyContact || '',
    website: settings.website || '',
    totalTables: settings.totalTables || 20,
    seatingCapacity: settings.seatingCapacity || 80,
    maxOrderValue: settings.maxOrderValue || 100000,
    minOrderValue: settings.minOrderValue || 100,
    taxRate: settings.taxRate || '18',
    taxType: settings.taxType || 'gst',
    serviceCharge: settings.serviceCharge || 0,
    serviceChargeType: settings.serviceChargeType || 'optional',
    roundingMethod: settings.roundingMethod || 'nearest',
    decimalPlaces: settings.decimalPlaces || '2',
    openingTime: settings.openingTime || '09:00',
    closingTime: settings.closingTime || '23:00',
    timezone: settings.timezone || 'Asia/Kolkata',
    operatingDays: settings.operatingDays || 'all',
    currency: settings.currency || 'INR',
    language: settings.language || 'en',
    dateFormat: settings.dateFormat || 'DD/MM/YYYY',
    timeFormat: settings.timeFormat || '24h',
    numberFormat: settings.numberFormat || 'indian',
    colorBlindMode: settings.colorBlindMode || false,
    
    // Display Settings
    screenDensity: settings.screenDensity || 'comfortable',
    fontSize: settings.fontSize || 'medium',
    showAnimations: settings.showAnimations !== false,
    animationSpeed: settings.animationSpeed || 'normal',
    showBorders: settings.showBorders !== false,
    borderRadius: settings.borderRadius || 'medium',
    showShadows: settings.showShadows !== false,
    
    // Theme Settings
    themeMode: settings.themeMode || 'dark',
    accentColor: settings.accentColor || '#6366f1',
    primaryColor: settings.primaryColor || '#8b5cf6',
    backgroundColor: settings.backgroundColor || '#000000',
    cardColor: settings.cardColor || '#111111',
    textColor: settings.textColor || '#ffffff',
    
    // Notification Settings
    enableSoundNotifications: settings.enableSoundNotifications !== false,
    enableDesktopNotifications: settings.enableDesktopNotifications !== false,
    notificationSound: settings.notificationSound || 'default',
    notificationVolume: settings.notificationVolume || 70,
    enableOrderAlerts: settings.enableOrderAlerts !== false,
    enableLowStockAlerts: settings.enableLowStockAlerts !== false,
    lowStockThreshold: settings.lowStockThreshold || 10,
    enablePaymentAlerts: settings.enablePaymentAlerts !== false,
    
    // Mobile UI Settings
    bottomNavStyle: settings.bottomNavStyle || 'icons',
    showLabelsOnMobile: settings.showLabelsOnMobile !== false,
    enableHapticFeedback: settings.enableHapticFeedback !== false,
    mobileFontSize: settings.mobileFontSize || 'medium',
    enableSwipeGestures: settings.enableSwipeGestures !== false,
    tabletSidebarMode: settings.tabletSidebarMode || 'auto',
    
    // Business Settings
    businessRegistrationNumber: settings.businessRegistrationNumber || '',
    businessLicenseNumber: settings.businessLicenseNumber || '',
    fssaiNumber: settings.fssaiNumber || '',
    foundedDate: settings.foundedDate || '',
    socialMediaInstagram: settings.socialMediaInstagram || '',
    socialMediaFacebook: settings.socialMediaFacebook || '',
    socialMediaTwitter: settings.socialMediaTwitter || '',
    
    // Advanced Tax Settings
    enableCompoundTax: settings.enableCompoundTax || false,
    taxInclusivePricing: settings.taxInclusivePricing || false,
    enableMultiTaxRates: settings.enableMultiTaxRates || false,
    cgstRate: settings.cgstRate || 9,
    sgstRate: settings.sgstRate || 9,
    igstRate: settings.igstRate || 18,
    cessRate: settings.cessRate || 0,
    
    // Dashboard Settings
    dashboardLayout: settings.dashboardLayout || 'default',
    showSalesWidget: settings.showSalesWidget !== false,
    showOrdersWidget: settings.showOrdersWidget !== false,
    showInventoryWidget: settings.showInventoryWidget !== false,
    showStaffWidget: settings.showStaffWidget !== false,
    showRevenueChart: settings.showRevenueChart !== false,
    showOrderChart: settings.showOrderChart !== false,
    widgetRefreshInterval: settings.widgetRefreshInterval || 30,
    
    // Reports Settings
    enableAutoReports: settings.enableAutoReports || false,
    reportSchedule: settings.reportSchedule || 'daily',
    reportFormat: settings.reportFormat || 'pdf',
    includeChartsInReports: settings.includeChartsInReports !== false,
    emailReportsTo: settings.emailReportsTo || '',
    
    // CRM Settings
    enableLoyaltyProgram: settings.enableLoyaltyProgram !== false,
    loyaltyPointsPerRupee: settings.loyaltyPointsPerRupee || 1,
    loyaltyPointsRedemptionRate: settings.loyaltyPointsRedemptionRate || 100,
    enableCustomerNotes: settings.enableCustomerNotes !== false,
    enableCustomerHistory: settings.enableCustomerHistory !== false,
    enableCustomerSegmentation: settings.enableCustomerSegmentation || false,
    
    // Staff Settings
    enableStaffTracking: settings.enableStaffTracking !== false,
    enableStaffPerformance: settings.enableStaffPerformance !== false,
    staffPerformanceMetric: settings.staffPerformanceMetric || 'orders',
    enableStaffScheduling: settings.enableStaffScheduling || false,
    defaultShiftDuration: settings.defaultShiftDuration || 8,
    
    // Menu Settings
    menuLayout: settings.menuLayout || 'grid',
    showItemImages: settings.showItemImages !== false,
    showItemDescriptions: settings.showItemDescriptions !== false,
    showCategoryImages: settings.showCategoryImages || false,
    enableQuickAdd: settings.enableQuickAdd !== false,
    menuSortOrder: settings.menuSortOrder || 'name',
    
    // Inventory Settings
    enableLowStockAlerts: settings.enableLowStockAlerts !== false,
    lowStockThreshold: settings.lowStockThreshold || 10,
    enableStockOutAlerts: settings.enableStockOutAlerts !== false,
    enableAutoRestock: settings.enableAutoRestock || false,
    inventoryTrackingMethod: settings.inventoryTrackingMethod || 'fifo',
    
    // Recipe Settings
    enableRecipeCosting: settings.enableRecipeCosting !== false,
    enableRecipePrepTime: settings.enableRecipePrepTime !== false,
    enableRecipeScaling: settings.enableRecipeScaling !== false,
    
    // Waste Settings
    enableWasteTracking: settings.enableWasteTracking !== false,
    requireWasteReason: settings.requireWasteReason !== false,
    requireWastePhoto: settings.requireWastePhoto || false,
    wasteCategories: settings.wasteCategories || ['spoiled', 'burnt', 'dropped', 'expired', 'mistake'],
    
    // Reservation Settings
    enableDeposits: settings.enableDeposits || false,
    depositAmount: settings.depositAmount || 500,
    depositType: settings.depositType || 'fixed',
    enableCancellationPolicy: settings.enableCancellationPolicy || false,
    cancellationHours: settings.cancellationHours || 24,
    maxPartySize: settings.maxPartySize || 20,
    
    // Token Settings
    tokenPrefix: settings.tokenPrefix || 'T',
    tokenStartNumber: settings.tokenStartNumber || 1,
    enableTokenResetDaily: settings.enableTokenResetDaily || false,
    tokenDisplayFormat: settings.tokenDisplayFormat || 'prefix_number',
    
    // Table Settings
    enableTableMerge: settings.enableTableMerge !== false,
    enableTableTransfer: settings.enableTableTransfer !== false,
    autoAssignTables: settings.autoAssignTables || false,
    tableCleaningTime: settings.tableCleaningTime || 15,
    
    // Waiter Settings
    enableWaiterCalls: settings.enableWaiterCalls !== false,
    enableWaiterTracking: settings.enableWaiterTracking || false,
    waiterCallTimeout: settings.waiterCallTimeout || 60,
    enableWaiterPerformance: settings.enableWaiterPerformance || false,
    
    // Kitchen Settings
    kitchenMode: settings.kitchenMode || 'standard',
    enableKitchenTimer: settings.enableKitchenTimer !== false,
    defaultPrepTime: settings.defaultPrepTime || 15,
    enableKitchenRouting: settings.enableKitchenRouting !== false,
    kitchenStationCount: settings.kitchenStationCount || 3,
    
    // Online Ordering Settings
    enableOnlineOrdering: settings.enableOnlineOrdering || false,
    onlinePlatform: settings.onlinePlatform || 'custom',
    enableDelivery: settings.enableDelivery || false,
    deliveryFee: settings.deliveryFee || 50,
    enablePickup: settings.enablePickup !== false,
    onlinePaymentMethods: settings.onlinePaymentMethods || ['upi', 'card'],
    
    // POS Settings
    enableQuickCheckout: settings.enableQuickCheckout !== false,
    enableOrderNotes: settings.enableOrderNotes !== false,
    enableCustomerSelection: settings.enableCustomerSelection !== false,
    enableTableSelection: settings.enableTableSelection !== false,
    defaultOrderType: settings.defaultOrderType || 'dine_in',
    
    // Workflow Settings
    enableOrderApproval: settings.enableOrderApproval || false,
    enablePaymentConfirmation: settings.enablePaymentConfirmation !== false,
    enableKOTPrinting: settings.enableKOTPrinting !== false,
    enableReceiptPrinting: settings.enableReceiptPrinting !== false,
    
    // Item Code Settings
    itemCodeFormat: settings.itemCodeFormat || 'auto',
    itemCodePrefix: settings.itemCodePrefix || '',
    enableBarcodeScanning: settings.enableBarcodeScanning || false,
    
    // Legacy Receipt Settings
    receiptFooter: settings.receiptFooter || '',
    receiptHeader: settings.receiptHeader || '',
    showStoreLogo: settings.showStoreLogo !== false,
    showCashierName: settings.showCashierName !== false,
    showPaymentDetails: settings.showPaymentDetails !== false,
    
    // QR Ordering Settings
    enableQRTables: settings.enableQRTables || false,
    qrExpirationTime: settings.qrExpirationTime || 3600,
    enableQRPayment: settings.enableQRPayment !== false,
    
    // Backup Settings
    enableAutoBackup: settings.enableAutoBackup || false,
    backupSchedule: settings.backupSchedule || 'daily',
    backupRetentionDays: settings.backupRetentionDays || 30,
    backupLocation: settings.backupLocation || 'local',
    
    // Refund Settings
    enableRefunds: settings.enableRefunds !== false,
    requireRefundReason: settings.requireRefundReason !== false,
    refundWindowHours: settings.refundWindowHours || 24,
    maxRefundAmount: settings.maxRefundAmount || 10000,
    enablePartialRefunds: settings.enablePartialRefunds !== false,
    
    // Security Settings
    enableRoleBasedAccess: settings.enableRoleBasedAccess !== false,
    enableTwoFactorAuth: settings.enableTwoFactorAuth || false,
    sessionTimeout: settings.sessionTimeout || 30,
    enableAuditLog: settings.enableAuditLog !== false,
    
    // Debug Settings
    enableDebugMode: settings.enableDebugMode || false,
    logLevel: settings.logLevel || 'error',
    enablePerformanceMonitoring: settings.enablePerformanceMonitoring || false,
    
    // Original settings
    codeType: settings.codeType || 'alphanumeric',
    razorpayKeyId: settings.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    razorpayKeySecret: settings.razorpayKeySecret || '',
    upiId: settings.upiId || '',
    brevoApiKey: settings.brevoApiKey || '',
    printerType: settings.printerType || 'thermal',
    autoPrintReceipt: settings.autoPrintReceipt !== false,
    kitchenDisplayEnabled: settings.kitchenDisplayEnabled !== false,
    showTokensOnOrders: settings.showTokensOnOrders !== false,
    groupByTable: settings.groupByTable !== false,
    showOrderTime: settings.showOrderTime !== false,
    showCustomerName: settings.showCustomerName !== false,
    autoRefreshOrders: settings.autoRefreshOrders !== false,
    allowOrderEdit: settings.allowOrderEdit !== false,
    allowOrderSplit: settings.allowOrderSplit !== false,
    showOrderTotal: settings.showOrderTotal !== false,
    qrOrderingEnabled: settings.qrOrderingEnabled !== false,
    qrRestaurantName: settings.qrRestaurantName || settings.storeName || '',
    qrWelcomeMessage: settings.qrWelcomeMessage || 'Welcome! Scan to order from your table.',
    qrGstRate: settings.qrGstRate ?? 18,
    qrSplitGst: settings.qrSplitGst !== false,
    qrAllowSpecialRequests: settings.qrAllowSpecialRequests !== false,
    qrAutoAcceptOrders: settings.qrAutoAcceptOrders !== false,
    qrShowItemDescriptions: settings.qrShowItemDescriptions !== false,
    qrShowCategoryFilter: settings.qrShowCategoryFilter !== false,
    qrShowSearch: settings.qrShowSearch !== false,
    qrAllowCallWaiter: settings.qrAllowCallWaiter !== false,
    qrPrimaryColor: settings.qrPrimaryColor || '#0a0a0a',
    qrAccentColor: settings.qrAccentColor || '#10b981',
    qrOrderingUrl: settings.qrOrderingUrl || (typeof window !== 'undefined' ? window.location.origin + '/qr-ordering.html' : '/qr-ordering.html'),
    // QR Receipt controls
    qrReceiptFooter: settings.qrReceiptFooter || '',
    qrShowReceiptOnOrder: settings.qrShowReceiptOnOrder !== false,
    qrReceiptShowFssai: settings.qrReceiptShowFssai !== false,
    qrReceiptShowTariff: settings.qrReceiptShowTariff !== false,
    qrReceiptShowReviewQr: settings.qrReceiptShowReviewQr !== false,
    // QR Payment controls
    qrEnablePaymentCash: settings.qrEnablePaymentCash !== false,
    qrEnablePaymentUPI: settings.qrEnablePaymentUPI !== false,
    qrEnablePaymentCard: settings.qrEnablePaymentCard !== false,
    // QR Tipping controls
    qrEnableTipping: settings.qrEnableTipping !== false,
    qrDefaultTipPercent: settings.qrDefaultTipPercent || 0,
    qrTipOptions: settings.qrTipOptions || [0, 5, 10, 15],
    // QR Customization controls
    qrEnableSizeOptions: settings.qrEnableSizeOptions !== false,
    qrEnableSpiceOptions: settings.qrEnableSpiceOptions !== false,
    qrEnableAddons: settings.qrEnableAddons !== false,
    qrAddonCheesePrice: settings.qrAddonCheesePrice || 15,
    qrAddonSaucePrice: settings.qrAddonSaucePrice || 10,
    qrSizeLargePrice: settings.qrSizeLargePrice || 20,
    // QR Order management
    qrEnableOrderCancel: settings.qrEnableOrderCancel !== false,
    qrEnableDarkMode: settings.qrEnableDarkMode !== false,
    qrEnableCombos: settings.qrEnableCombos !== false,
    qrEnableSplitBilling: settings.qrEnableSplitBilling !== false,
    // QR Session & Business Hours
    qrSessionTimeout: settings.qrSessionTimeout || 30, // minutes
    qrEnableBusinessHours: settings.qrEnableBusinessHours !== false,
    qrBusinessHoursStart: settings.qrBusinessHoursStart || '09:00',
    qrBusinessHoursEnd: settings.qrBusinessHoursEnd || '22:00',
    qrClosedMessage: settings.qrClosedMessage || 'We are currently closed. Please visit us during our business hours.',
    // GST & Invoice settings
    qrGstRoundingMode: settings.qrGstRoundingMode || 'standard', // 'standard', 'up', 'down', 'nearest'
    qrEnableSequentialInvoices: settings.qrEnableSequentialInvoices !== false,
    qrInvoicePrefix: settings.qrInvoicePrefix || 'INV',
    qrInvoiceStartNumber: settings.qrInvoiceStartNumber || 1,
    qrLastInvoiceNumber: settings.qrLastInvoiceNumber || 0,
    // Printer settings
    qrEnableThermalPrinter: settings.qrEnableThermalPrinter !== false,
    qrPrinterPort: settings.qrPrinterPort || '9100',
    qrPrinterPaperWidth: settings.qrPrinterPaperWidth || 80, // 58mm or 80mm
    theme: settings.theme || 'light',
    colorBlindMode: settings.colorBlindMode !== false,
    orderTimeout: settings.orderTimeout || '30',
    lowStockAlert: settings.lowStockAlert !== false,
    dailyReportTime: settings.dailyReportTime || '23:00',
    enableNotifications: settings.enableNotifications !== false,
    gstin: settings.gstin || '',
    gstRegistered: settings.gstRegistered !== false,
    fssaiLicense: settings.fssaiLicense || '',
    tariffCode: settings.tariffCode || '',
    googleReviewUrl: settings.googleReviewUrl || '',
    dataRetentionDays: settings.dataRetentionDays || '365',
    posMode: settings.posMode || 'basic',
    receiptTemplate: settings.receiptTemplate || 'standard',
    customReceiptHeader: settings.customReceiptHeader || '',
    customReceiptFooter: settings.customReceiptFooter || '',
    showLogoOnReceipt: settings.showLogoOnReceipt !== false,
    showGstOnReceipt: settings.showGstOnReceipt !== false,
    showTableOnReceipt: settings.showTableOnReceipt !== false,
    showCustomerOnReceipt: settings.showCustomerOnReceipt !== false,
    receiptFontSize: settings.receiptFontSize || '12',
    // Per-tab dark mode settings
    tabDarkModes: settings.tabDarkModes || {
      orders: false,
      dashboard: false,
      reports: false,
      crm: false,
      staff: false,
      menu: false,
      inventory: false,
      recipes: false,
      waste: false,
      reservations: false,
      tokens: false,
      tables: false,
      waiters: false,
      settings: false
    },
    // Workflow settings
    requireCustomer: settings.requireCustomer || false,
    requireTable: settings.requireTable || false,
    allowWalkIn: settings.allowWalkIn !== false,
    requirePaymentBeforeKOT: settings.requirePaymentBeforeKOT || false,
    autoCreateKOT: settings.autoCreateKOT !== false,
    allowedPaymentMethods: settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI', 'UPI_QR', 'SPLIT'],
    enableSplitPayment: settings.enableSplitPayment !== false,
    maxSplitPayments: settings.maxSplitPayments || 5,
    enableDiscount: settings.enableDiscount !== false,
    maxDiscountPercent: settings.maxDiscountPercent || 50,
    requireManagerForHighDiscount: settings.requireManagerForHighDiscount || false,
    highDiscountThreshold: settings.highDiscountThreshold || 20,
    enableHoldOrders: settings.enableHoldOrders === true,
    maxHoldOrders: settings.maxHoldOrders || 10,
    holdOrderTimeout: settings.holdOrderTimeout || 60,
    enableCustomOrders: settings.enableCustomOrders !== false,
    requireApprovalForCustomOrders: settings.requireApprovalForCustomOrders || false,
    // Custom order accordion settings
    customOrderShowCategory:      settings.customOrderShowCategory !== false,
    customOrderShowNotes:         settings.customOrderShowNotes !== false,
    customOrderDefaultCategory:   settings.customOrderDefaultCategory || 'Custom',
    // Order card column settings
    orderCardColumn_table:        settings.orderCardColumn_table !== false,
    orderCardColumn_time:         settings.orderCardColumn_time !== false,
    orderCardColumn_customer:     settings.orderCardColumn_customer !== false,
    orderCardColumn_categories:  settings.orderCardColumn_categories !== false,
    orderCardColumn_items:        settings.orderCardColumn_items !== false,
    orderCardColumn_total:        settings.orderCardColumn_total !== false,
    orderCardColumn_status:       settings.orderCardColumn_status !== false,
    customOrderExtraCategories:   settings.customOrderExtraCategories || [],
    customOrderPresets: settings.customOrderPresets || [
      { name: 'Extra Sauce',      price: 10,  icon: '🥫' },
      { name: 'Extra Cheese',     price: 15,  icon: '🧀' },
      { name: 'Takeaway Box',     price: 15,  icon: '📦' },
      { name: 'Birthday Candles', price: 20,  icon: '🕯️' },
      { name: 'Special Message',  price: 25,  icon: '🖋️' },
      { name: 'Ice Cream Scoop',  price: 40,  icon: '🍨' },
    ],
    enableVoid: settings.enableVoid !== false,
    requireManagerForVoid: settings.requireManagerForVoid || false,
    enableOrderNotes: settings.enableOrderNotes !== false,
    requireNotesForCustomOrders: settings.requireNotesForCustomOrders || false,
    workflowSteps: settings.workflowSteps || ['items', 'customer', 'table', 'payment'],
    autoPrintKOT: settings.autoPrintKOT !== false,
    kotPrintStations: settings.kotPrintStations || ['kitchen', 'bar'],
    enableTokenSystem: settings.enableTokenSystem !== false,
    tokenPrefix: settings.tokenPrefix || 'T',
    autoAssignTables: settings.autoAssignTables || false,
    // Mobile & Tablet UI settings
    mobileNavPosition:  settings.mobileNavPosition  ?? 'bottom',
    mobileNavTabs:      settings.mobileNavTabs       ?? ['orders', 'dashboard', 'reports', 'crm', 'more'],
    mobileShowLabels:   settings.mobileShowLabels    ?? true,
    mobileNavStyle:     settings.mobileNavStyle      ?? 'pill',
    mobileIconSize:     settings.mobileIconSize      ?? 'md',
    tabletLayoutMode:   settings.tabletLayoutMode    ?? 'topbar', // Tablets now always use topbar like laptops
    tabletSidebarMode:  settings.tabletSidebarMode   ?? 'compact',
    // Receipt additional fields
    storeLogo: settings.storeLogo || '',
    cashierName: settings.cashierName || '',
    showCashierOnReceipt: settings.showCashierOnReceipt !== false,
    showEmailOnReceipt: settings.showEmailOnReceipt !== false,
    showPaymentDetailsOnReceipt: settings.showPaymentDetailsOnReceipt !== false,
    showBillIdOnReceipt: settings.showBillIdOnReceipt !== false,
    enableAutoRefund: settings.enableAutoRefund || false,
    refundTimeLimit: settings.refundTimeLimit || 24,
    // PCI DSS Compliance
    enablePciDssLogging: settings.enablePciDssLogging || false,
    enableCardTokenization: settings.enableCardTokenization !== false,
    requireCvvForSavedCards: settings.requireCvvForSavedCards || false,
    cardDataRetentionDays: settings.cardDataRetentionDays || 30,
    // GDPR Compliance
    enableGdprCompliance: settings.enableGdprCompliance !== false,
    requireDataConsent: settings.requireDataConsent || false,
    enableRightToDeletion: settings.enableRightToDeletion !== false,
    customerDataRetentionDays: settings.customerDataRetentionDays || 365,
    // Security Settings
    enableEncryption: settings.enableEncryption !== false,
    enableAuditLog: settings.enableAuditLog !== false,
    sessionTimeout: settings.sessionTimeout || 30,
    
    // Receipt Studio Settings
    receiptLogo: settings.receiptLogo || '',
    receiptLogoPosition: settings.receiptLogoPosition || 'center',
    receiptLogoSize: settings.receiptLogoSize || 48,
    receiptHeader: settings.receiptHeader || '',
    receiptHeaderStyle: settings.receiptHeaderStyle || 'bold',
    receiptHeaderBorder: settings.receiptHeaderBorder || 'dashed',
    receiptFooter: settings.receiptFooter || '',
    receiptFooterStyle: settings.receiptFooterStyle || 'italic',
    receiptPaperWidth: settings.receiptPaperWidth || '80mm',
    receiptMarginTop: settings.receiptMarginTop || 16,
    receiptMarginBottom: settings.receiptMarginBottom || 16,
    receiptMarginLeft: settings.receiptMarginLeft || 16,
    receiptMarginRight: settings.receiptMarginRight || 16,
    receiptPrinterPort: settings.receiptPrinterPort || '9100',
    receiptPrintDensity: settings.receiptPrintDensity || '203',
    receiptCutMode: settings.receiptCutMode || 'full',
    receiptPrintSpeed: settings.receiptPrintSpeed || 'normal',
    receiptShowLogo: settings.receiptShowLogo !== false,
    receiptShowHeader: settings.receiptShowHeader !== false,
    receiptShowFooter: settings.receiptShowFooter !== false,
    receiptShowDateTime: settings.receiptShowDateTime !== false,
    receiptShowBillId: settings.receiptShowBillId !== false,
    receiptShowOrderId: settings.receiptShowOrderId !== false,
    receiptShowTable: settings.receiptShowTable !== false,
    receiptShowServer: settings.receiptShowServer !== false,
    receiptShowCustomer: settings.receiptShowCustomer !== false,
    receiptShowItems: settings.receiptShowItems !== false,
    receiptShowQuantities: settings.receiptShowQuantities !== false,
    receiptShowPrices: settings.receiptShowPrices !== false,
    receiptShowSubtotal: settings.receiptShowSubtotal !== false,
    receiptShowTax: settings.receiptShowTax !== false,
    receiptShowDiscount: settings.receiptShowDiscount !== false,
    receiptShowServiceCharge: settings.receiptShowServiceCharge !== false,
    receiptShowTips: settings.receiptShowTips !== false,
    receiptShowGrandTotal: settings.receiptShowGrandTotal !== false,
    receiptShowPaymentMethod: settings.receiptShowPaymentMethod !== false,
    receiptShowChange: settings.receiptShowChange !== false,
    receiptShowBarcode: settings.receiptShowBarcode !== false,
    receiptFontFamily: settings.receiptFontFamily || 'Courier New',
    receiptFontSize: settings.receiptFontSize || 12,
    receiptHeaderFontSize: settings.receiptHeaderFontSize || 14,
    receiptTotalFontSize: settings.receiptTotalFontSize || 16,
    receiptLineHeight: settings.receiptLineHeight || 1.4,
    receiptTextAlign: settings.receiptTextAlign || 'left',
    receiptTextColor: settings.receiptTextColor || '#000000',
    receiptBorderColor: settings.receiptBorderColor || '#000000',
    receiptGstin: settings.receiptGstin || '',
    receiptFssai: settings.receiptFssai || '',
    receiptPan: settings.receiptPan || '',
    receiptTariff: settings.receiptTariff || '',
    receiptShowGst: settings.receiptShowGst !== false,
    receiptShowGstSeparate: settings.receiptShowGstSeparate !== false,
    receiptShowFssai: settings.receiptShowFssai !== false,
    receiptShowPan: settings.receiptShowPan !== false,
    receiptShowTariff: settings.receiptShowTariff !== false,
    receiptShowTaxInvoice: settings.receiptShowTaxInvoice !== false,
    receiptShowReverseCharge: settings.receiptShowReverseCharge !== false,
    receiptShowQr: settings.receiptShowQr !== false,
    receiptShowReviewQr: settings.receiptShowReviewQr !== false,
    receiptGoogleReviewUrl: settings.receiptGoogleReviewUrl || '',
    receiptShowTerms: settings.receiptShowTerms !== false,
    receiptShowContact: settings.receiptShowContact !== false,
    receiptShowSocial: settings.receiptShowSocial !== false,
    receiptShowWebsite: settings.receiptShowWebsite !== false,
    receiptShowEmail: settings.receiptShowEmail !== false,
    receiptShowCashier: settings.receiptShowCashier !== false,
    receiptAutoPrint: settings.receiptAutoPrint !== false,
    receiptTemplate: settings.receiptTemplate || 'standard',
    customReceiptHeader: settings.customReceiptHeader || '',
    customReceiptFooter: settings.customReceiptFooter || '',
    brevoApiKey: settings.brevoApiKey || '',
    storeEmail: settings.storeEmail || '',

    // Toast Orders Settings
    toastShowPrice: settings.toastShowPrice !== false,
    toastShowQuantity: settings.toastShowQuantity !== false,
    toastShowCategory: settings.toastShowCategory !== false,
    toastAutoSave: settings.toastAutoSave !== false,
    toastShowModals: settings.toastShowModals !== false,
    toastEnableDiscount: settings.toastEnableDiscount !== false,
    toastEnableTips: settings.toastEnableTips !== false,
    toastDefaultPaymentMethod: settings.toastDefaultPaymentMethod || 'cash',
    toastDiscountMaxPercent: settings.toastDiscountMaxPercent || 50,
    toastDiscountRequireReason: settings.toastDiscountRequireReason !== false,
    toastEnableServiceCharge: settings.toastEnableServiceCharge !== false,
    toastServiceChargePercent: settings.toastServiceChargePercent || 10,
    toastEnableTaxExemption: settings.toastEnableTaxExemption !== false,
    toastDefaultTable: settings.toastDefaultTable || 1,
    toastAutoAssignTable: settings.toastAutoAssignTable || false,
    toastEnableSeatSplitting: settings.toastEnableSeatSplitting !== false,
    toastMaxSeats: settings.toastMaxSeats || 10,
    toastEnableServerAssignment: settings.toastEnableServerAssignment !== false,
    toastDefaultServer: settings.toastDefaultServer || '',
    toastEnableOrderTimer: settings.toastEnableOrderTimer !== false,
    toastOrderTimerWarning: settings.toastOrderTimerWarning || 30,
    toastEnableKitchenDelay: settings.toastEnableKitchenDelay !== false,
    toastDefaultKitchenDelay: settings.toastDefaultKitchenDelay || 0,
    toastEnableItemSplitting: settings.toastEnableItemSplitting !== false,
    toastEnableItemTransfer: settings.toastEnableItemTransfer !== false,
    toastEnableVoid: settings.toastEnableVoid !== false,
    toastVoidRequireReason: settings.toastVoidRequireReason !== false,
    toastVoidRequireManager: settings.toastVoidRequireManager || false,
    toastEnableDuplication: settings.toastEnableDuplication !== false,
    toastEnableCashDrawer: settings.toastEnableCashDrawer !== false,
    toastCashDrawerAutoOpen: settings.toastCashDrawerAutoOpen !== false,
    toastEnablePrint: settings.toastEnablePrint !== false,
    toastPrintOnPayment: settings.toastPrintOnPayment !== false,
    toastPrintOnKOT: settings.toastPrintOnKOT !== false,
    toastEnableLoyalty: settings.toastEnableLoyalty !== false,
    toastLoyaltyPointsPerRupee: settings.toastLoyaltyPointsPerRupee || 1,
    toastEnableOrderNotes: settings.toastEnableOrderNotes !== false,
    toastEnableCustomerNotes: settings.toastEnableCustomerNotes !== false,
    toastDefaultOrderType: settings.toastDefaultOrderType || 'dine-in',
    toastEnableTakeout: settings.toastEnableTakeout !== false,
    toastEnableDelivery: settings.toastEnableDelivery !== false,
    toastDeliveryFee: settings.toastDeliveryFee || 50,
    toastDeliveryFeeType: settings.toastDeliveryFeeType || 'fixed',
    toastMinimumOrderValue: settings.toastMinimumOrderValue || 0,
    toastMaximumOrderValue: settings.toastMaximumOrderValue || 100000,
    toastOrderValidation: settings.toastOrderValidation !== false,
    toastAutoCompleteOrders: settings.toastAutoCompleteOrders || false,
    toastCompleteOnPayment: settings.toastCompleteOnPayment !== false,
    toastAllowOrderModification: settings.toastAllowOrderModification !== false,
    toastModificationTimeout: settings.toastModificationTimeout || 5,
    toastEnableHoldOrders: settings.toastEnableHoldOrders !== false,
    toastMaxHoldOrders: settings.toastMaxHoldOrders || 10,
    toastHoldOrderTimeout: settings.toastHoldOrderTimeout || 60,
    toastEnableOrderHistory: settings.toastEnableOrderHistory !== false,
    toastHistoryRetentionDays: settings.toastHistoryRetentionDays || 30,
    toastEnableQuickActions: settings.toastEnableQuickActions !== false,
    toastQuickActionButtons: settings.toastQuickActionButtons || ['Pay', 'Print', 'Hold', 'Void'],
    toastEnableShortcuts: settings.toastEnableShortcuts !== false,
    toastShortcutMode: settings.toastShortcutMode || 'numeric',
    toastCartLayout: settings.toastCartLayout || 'list',
    toastCartGrouping: settings.toastCartGrouping || 'category',
    toastCartSorting: settings.toastCartSorting || 'time',
    toastShowItemImages: settings.toastShowItemImages !== false,
    toastItemImageSize: settings.toastItemImageSize || 'medium',
    toastEnableItemSearch: settings.toastEnableItemSearch !== false,
    toastSearchMode: settings.toastSearchMode || 'fuzzy',
    toastEnableFavorites: settings.toastEnableFavorites !== false,
    toastMaxFavorites: settings.toastMaxFavorites || 20,
    toastEnableRecentItems: settings.toastEnableRecentItems !== false,
    toastRecentItemsCount: settings.toastRecentItemsCount || 10,
    toastEnableQuantityButtons: settings.toastEnableQuantityButtons !== false,
    toastQuantityButtonValues: settings.toastQuantityButtonValues || [1, 2, 3, 4, 5],
    toastEnableModifierPrompt: settings.toastEnableModifierPrompt !== false,
    toastModifierSelectionMode: settings.toastModifierSelectionMode || 'multi',
    toastEnableVariantSelection: settings.toastEnableVariantSelection !== false,
    toastVariantSelectionMode: settings.toastVariantSelectionMode || 'single',
    toastEnableComboMeals: settings.toastEnableComboMeals !== false,
    toastComboDiscountPercent: settings.toastComboDiscountPercent || 10,
    toastEnableHappyHour: settings.toastEnableHappyHour || false,
    toastHappyHourStart: settings.toastHappyHourStart || '15:00',
    toastHappyHourEnd: settings.toastHappyHourEnd || '18:00',
    toastHappyHourDiscount: settings.toastHappyHourDiscount || 20,
    toastEnablePromotions: settings.toastEnablePromotions !== false,
    toastPromotionAutoApply: settings.toastPromotionAutoApply || false,
    toastEnableCoupons: settings.toastEnableCoupons !== false,
    toastCouponValidation: settings.toastCouponValidation !== false,
    toastEnableGiftCards: settings.toastEnableGiftCards !== false,
    toastGiftCardValidation: settings.toastGiftCardValidation !== false,
    toastEnableRefunds: settings.toastEnableRefunds !== false,
    toastRefundRequireReason: settings.toastRefundRequireReason !== false,
    toastRefundTimeout: settings.toastRefundTimeout || 24,
    toastRefundApprovalRequired: settings.toastRefundApprovalRequired || false,
    toastEnableExchange: settings.toastEnableExchange !== false,
    toastExchangePolicy: settings.toastExchangePolicy || 'same-day',
    toastEnableSplitsPayment: settings.toastEnableSplitsPayment !== false,
    toastMaxSplits: settings.toastMaxSplits || 5,
    toastSplitValidation: settings.toastSplitValidation !== false,
    toastTipOptions: settings.toastTipOptions || [10, 15, 20, 25],
    toastTipCalculation: settings.toastTipCalculation || 'pre-tax',
    toastServiceChargeTaxable: settings.toastServiceChargeTaxable !== false,
    toastEnableGratuity: settings.toastEnableGratuity !== false,
    toastGratuityPercent: settings.toastGratuityPercent || 5,
    toastGratuityAutoApply: settings.toastGratuityAutoApply || false,
    toastGratuityGroupSize: settings.toastGratuityGroupSize || 8,
    
    // Oracle KDS Settings
    oracleKdsAutoAssign: settings.oracleKdsAutoAssign || false,
    oracleKdsShowTimer: settings.oracleKdsShowTimer !== false,
    oracleKdsColorCode: settings.oracleKdsColorCode || 'red',
    oracleKdsSortBy: settings.oracleKdsSortBy || 'time',
    oracleKdsShowIngredients: settings.oracleKdsShowIngredients !== false,
    oracleKdsStationCount: settings.oracleKdsStationCount || 5,
    oracleKdsStations: settings.oracleKdsStations || ['Hot', 'Cold', 'Grill', 'Fry', 'Prep'],
    oracleKdsDefaultPrepTime: settings.oracleKdsDefaultPrepTime || 15,
    oracleKdsPriorityEnabled: settings.oracleKdsPriorityEnabled !== false,
    oracleKdsShowPriority: settings.oracleKdsShowPriority !== false,
    oracleKdsAutoRefresh: settings.oracleKdsAutoRefresh !== false,
    oracleKdsRefreshInterval: settings.oracleKdsRefreshInterval || 30,
    oracleKdsShowTableNumber: settings.oracleKdsShowTableNumber !== false,
    oracleKdsShowServerName: settings.oracleKdsShowServerName !== false,
    oracleKdsShowCustomerName: settings.oracleKdsShowCustomerName !== false,
    oracleKdsGroupByStation: settings.oracleKdsGroupByStation !== false,
    oracleKdsColorByTime: settings.oracleKdsColorByTime !== false,
    oracleKdsTimeThresholds: settings.oracleKdsTimeThresholds || { green: 10, yellow: 20, red: 30 },
    oracleKdsShowAllergens: settings.oracleKdsShowAllergens !== false,
    oracleKdsShowModifiers: settings.oracleKdsShowModifiers !== false,
    oracleKdsShowNotes: settings.oracleKdsShowNotes !== false,
    oracleKdsAutoPrint: settings.oracleKdsAutoPrint !== false,
    oracleKdsSoundAlerts: settings.oracleKdsSoundAlerts !== false,
    oracleKdsSoundType: settings.oracleKdsSoundType || 'chime',
    oracleKdsVolume: settings.oracleKdsVolume || 70,
    oracleKdsEnableFire: settings.oracleKdsEnableFire !== false,
    oracleKdsAutoFire: settings.oracleKdsAutoFire || false,
    oracleKdsFireDelay: settings.oracleKdsFireDelay || 5,
    oracleKdsFireConfirmation: settings.oracleKdsFireConfirmation !== false,
    oracleKdsEnableRush: settings.oracleKdsEnableRush !== false,
    oracleKdsRushMode: settings.oracleKdsRushMode || 'auto',
    oracleKdsRushThreshold: settings.oracleKdsRushThreshold || 10,
    oracleKdsShowRushIndicator: settings.oracleKdsShowRushIndicator !== false,
    oracleKdsEnableDelay: settings.oracleKdsEnableDelay !== false,
    oracleKdsDelayReasons: settings.oracleKdsDelayReasons || ['Busy', 'Missing Item', 'Equipment'],
    oracleKdsDelayRequireReason: settings.oracleKdsDelayRequireReason !== false,
    oracleKdsShowDelayIndicator: settings.oracleKdsShowDelayIndicator !== false,
    oracleKdsEnableHold: settings.oracleKdsEnableHold !== false,
    oracleKdsHoldTimeout: settings.oracleKdsHoldTimeout || 30,
    oracleKdsAutoResumeHold: settings.oracleKdsAutoResumeHold || false,
    oracleKdsShowHoldIndicator: settings.oracleKdsShowHoldIndicator !== false,
    oracleKdsEnableCancel: settings.oracleKdsEnableCancel !== false,
    oracleKdsCancelRequireReason: settings.oracleKdsCancelRequireReason !== false,
    oracleKdsCancelRequireManager: settings.oracleKdsCancelRequireManager || false,
    oracleKdsShowCanceledOrders: settings.oracleKdsShowCanceledOrders !== false,
    oracleKdsCanceledRetention: settings.oracleKdsCanceledRetention || 24,
    oracleKdsEnableComplete: settings.oracleKdsEnableComplete !== false,
    oracleKdsCompleteConfirmation: settings.oracleKdsCompleteConfirmation !== false,
    oracleKdsCompleteSound: settings.oracleKdsCompleteSound !== false,
    oracleKdsShowCompletedOrders: settings.oracleKdsShowCompletedOrders !== false,
    oracleKdsCompletedRetention: settings.oracleKdsCompletedRetention || 60,
    oracleKdsEnableBatch: settings.oracleKdsEnableBatch !== false,
    oracleKdsBatchSize: settings.oracleKdsBatchSize || 5,
    oracleKdsBatchComplete: settings.oracleKdsBatchComplete !== false,
    oracleKdsShowBatchIndicator: settings.oracleKdsShowBatchIndicator !== false,
    oracleKdsEnableRouting: settings.oracleKdsEnableRouting !== false,
    oracleKdsRoutingRules: settings.oracleKdsRoutingRules || 'category',
    oracleKdsAutoRoute: settings.oracleKdsAutoRoute !== false,
    oracleKdsShowRouting: settings.oracleKdsShowRouting !== false,
    oracleKdsEnableFiltering: settings.oracleKdsEnableFiltering !== false,
    oracleKdsFilterOptions: settings.oracleKdsFilterOptions || ['all', 'active', 'completed', 'delayed'],
    oracleKdsDefaultFilter: settings.oracleKdsDefaultFilter || 'all',
    oracleKdsEnableSearch: settings.oracleKdsEnableSearch !== false,
    oracleKdsSearchFields: settings.oracleKdsSearchFields || ['table', 'order', 'item'],
    oracleKdsShowItemCount: settings.oracleKdsShowItemCount !== false,
    oracleKdsItemCountBadge: settings.oracleKdsItemCountBadge !== false,
    oracleKdsShowTotalValue: settings.oracleKdsShowTotalValue !== false,
    oracleKdsShowDuration: settings.oracleKdsShowDuration !== false,
    oracleKdsShowElapsed: settings.oracleKdsShowElapsed !== false,
    oracleKdsShowRemaining: settings.oracleKdsShowRemaining !== false,
    oracleKdsTimeFormat: settings.oracleKdsTimeFormat || 'mm:ss',
    oracleKdsEnableFullscreen: settings.oracleKdsEnableFullscreen !== false,
    oracleKdsAutoFullscreen: settings.oracleKdsAutoFullscreen || false,
    oracleKdsShowStatusHeader: settings.oracleKdsShowStatusHeader !== false,
    oracleKdsHeaderCustomization: settings.oracleKdsHeaderCustomization || false,
    oracleKdsEnableKeyboardShortcuts: settings.oracleKdsEnableKeyboardShortcuts !== false,
    oracleKdsShortcutMode: settings.oracleKdsShortcutMode || 'numeric',
    oracleKdsEnableTouchMode: settings.oracleKdsEnableTouchMode !== false,
    oracleKdsTouchButtonSize: settings.oracleKdsTouchButtonSize || 'large',
    oracleKdsEnableVoiceCommands: settings.oracleKdsEnableVoiceCommands !== false,
    oracleKdsVoiceLanguage: settings.oracleKdsVoiceLanguage || 'en',
    
    // Split KDS Settings
    splitKdsEnableSplitting: settings.splitKdsEnableSplitting !== false,
    splitKdsAutoSplit: settings.splitKdsAutoSplit || false,
    splitKdsMaxSplits: settings.splitKdsMaxSplits || 4,
    splitKdsShowProgress: settings.splitKdsShowProgress !== false,
    splitKdsSplitByCategory: settings.splitKdsSplitByCategory !== false,
    splitKdsSplitByStation: settings.splitKdsSplitByStation !== false,
    splitKdsAutoMerge: settings.splitKdsAutoMerge || false,
    splitKdsMergeThreshold: settings.splitKdsMergeThreshold || 2,
    splitKdsShowSplitOrigin: settings.splitKdsShowSplitOrigin !== false,
    splitKdsEnableManualSplit: settings.splitKdsEnableManualSplit !== false,
    splitKdsSplitRules: settings.splitKdsSplitRules || 'quantity',
    splitKdsMinSplitQuantity: settings.splitKdsMinSplitQuantity || 2,
    splitKdsShowSplitIndicator: settings.splitKdsShowSplitIndicator !== false,
    splitKdsSplitIndicatorColor: settings.splitKdsSplitIndicatorColor || 'orange',
    splitKdsEnableCrossStation: settings.splitKdsEnableCrossStation !== false,
    splitKdsSyncAcrossStations: settings.splitKdsSyncAcrossStations !== false,
    splitKdsSyncInterval: settings.splitKdsSyncInterval || 5,
    splitKdsShowSyncStatus: settings.splitKdsShowSyncStatus !== false,
    splitKdsEnableSplitReorder: settings.splitKdsEnableSplitReorder !== false,
    splitKdsReorderMode: settings.splitKdsReorderMode || 'drag',
    splitKdsShowSplitQueue: settings.splitKdsShowSplitQueue !== false,
    splitKdsQueuePosition: settings.splitKdsQueuePosition || 'bottom',
    splitKdsEnableSplitHistory: settings.splitKdsEnableSplitHistory !== false,
    splitKdsHistoryRetention: settings.splitKdsHistoryRetention || 24,
    splitKdsShowSplitTimestamp: settings.splitKdsShowSplitTimestamp !== false,
    splitKdsTimestampFormat: settings.splitKdsTimestampFormat || 'HH:mm',
    splitKdsEnableSplitNotes: settings.splitKdsEnableSplitNotes !== false,
    splitKdsSplitNotesRequired: settings.splitKdsSplitNotesRequired !== false,
    splitKdsEnableSplitPriority: settings.splitKdsEnableSplitPriority !== false,
    splitKdsPriorityInheritance: settings.splitKdsPriorityInheritance !== false,
    splitKdsEnableSplitTiming: settings.splitKdsEnableSplitTiming !== false,
    splitKdsTimingTracking: settings.splitKdsTimingTracking || 'individual',
    splitKdsShowSplitTimer: settings.splitKdsShowSplitTimer !== false,
    splitKdsTimerFormat: settings.splitKdsTimerFormat || 'mm:ss',
    splitKdsEnableSplitCompletion: settings.splitKdsEnableSplitCompletion !== false,
    splitKdsCompletionMode: settings.splitKdsCompletionMode || 'any',
    splitKdsAutoCompleteAll: settings.splitKdsAutoCompleteAll || false,
    splitKdsShowSplitStatus: settings.splitKdsShowSplitStatus !== false,
    splitKdsStatusDisplay: settings.splitKdsStatusDisplay || 'progress-bar',
    splitKdsEnableSplitReassignment: settings.splitKdsEnableSplitReassignment !== false,
    splitKdsReassignmentRules: settings.splitKdsReassignmentRules || 'load-balancing',
    splitKdsShowReassignmentHistory: settings.splitKdsShowReassignmentHistory !== false,
    splitKdsEnableSplitCancellation: settings.splitKdsEnableSplitCancellation !== false,
    splitKdsCancelCascade: settings.splitKdsCancelCascade || false,
    splitKdsCancelRequireReason: settings.splitKdsCancelRequireReason !== false,
    splitKdsShowCancelledSplits: settings.splitKdsShowCancelledSplits !== false,
    splitKdsCancelledRetention: settings.splitKdsCancelledRetention || 12,
    
    // Chowbus KDS Settings
    chowbusKdsEnableBusManagement: settings.chowbusKdsEnableBusManagement || false,
    chowbusKdsBusCount: settings.chowbusKdsBusCount || 5,
    chowbusKdsAutoAssign: settings.chowbusKdsAutoAssign || false,
    chowbusKdsShowRoute: settings.chowbusKdsShowRoute !== false,
    chowbusKdsMaxOrdersPerBus: settings.chowbusKdsMaxOrdersPerBus || 20,
    chowbusKdsBusCapacity: settings.chowbusKdsBusCapacity || 50,
    chowbusKdsAutoOptimize: settings.chowbusKdsAutoOptimize || false,
    chowbusKdsShowBusStatus: settings.chowbusKdsShowBusStatus !== false,
    chowbusKdsShowETA: settings.chowbusKdsShowETA !== false,
    chowbusKdsDefaultETA: settings.chowbusKdsDefaultETA || 30,
    chowbusKdsTrackDriver: settings.chowbusKdsTrackDriver !== false,
    chowbusKdsShowDriverLocation: settings.chowbusKdsShowDriverLocation !== false,
    chowbusKdsEnableDriverNotes: settings.chowbusKdsEnableDriverNotes !== false,
    chowbusKdsShowDeliveryMap: settings.chowbusKdsShowDeliveryMap !== false,
    chowbusKdsRouteOptimization: settings.chowbusKdsRouteOptimization || 'nearest',
    chowbusKdsAutoReassign: settings.chowbusKdsAutoReassign || false,
    chowbusKdsDelayThreshold: settings.chowbusKdsDelayThreshold || 15,
    chowbusKdsNotifyOnDelay: settings.chowbusKdsNotifyOnDelay !== false,
    chowbusKdsBusColors: settings.chowbusKdsBusColors || ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    chowbusKdsBusNaming: settings.chowbusKdsBusNaming || 'number',
    chowbusKdsShowBusIcon: settings.chowbusKdsShowBusIcon !== false,
    chowbusKdsBusIconType: settings.chowbusKdsBusIconType || 'default',
    chowbusKdsEnableBusCapacity: settings.chowbusKdsEnableBusCapacity !== false,
    chowbusKdsCapacityWarning: settings.chowbusKdsCapacityWarning || 80,
    chowbusKdsCapacityCritical: settings.chowbusKdsCapacityCritical || 95,
    chowbusKdsShowCapacityIndicator: settings.chowbusKdsShowCapacityIndicator !== false,
    chowbusKdsEnableBusSchedule: settings.chowbusKdsEnableBusSchedule !== false,
    chowbusKdsScheduleStart: settings.chowbusKdsScheduleStart || '09:00',
    chowbusKdsScheduleEnd: settings.chowbusKdsScheduleEnd || '22:00',
    chowbusKdsShowSchedule: settings.chowbusKdsShowSchedule !== false,
    chowbusKdsEnableBusMaintenance: settings.chowbusKdsEnableBusMaintenance !== false,
    chowbusKdsMaintenanceSchedule: settings.chowbusKdsMaintenanceSchedule || [],
    chowbusKdsShowMaintenanceStatus: settings.chowbusKdsShowMaintenanceStatus !== false,
    chowbusKdsEnableDriverManagement: settings.chowbusKdsEnableDriverManagement !== false,
    chowbusKdsDriverCapacity: settings.chowbusKdsDriverCapacity || 1,
    chowbusKdsDriverShifts: settings.chowbusKdsDriverShifts || ['morning', 'afternoon', 'evening'],
    chowbusKdsShowDriverInfo: settings.chowbusKdsShowDriverInfo !== false,
    chowbusKdsDriverInfoFields: settings.chowbusKdsDriverInfoFields || ['name', 'phone', 'rating'],
    chowbusKdsEnableDriverRating: settings.chowbusKdsEnableDriverRating !== false,
    chowbusKdsRatingScale: settings.chowbusKdsRatingScale || 5,
    chowbusKdsShowDriverRating: settings.chowbusKdsShowDriverRating !== false,
    chowbusKdsEnableDriverFeedback: settings.chowbusKdsEnableDriverFeedback !== false,
    chowbusKdsFeedbackRequired: settings.chowbusKdsFeedbackRequired !== false,
    chowbusKdsEnableOrderTracking: settings.chowbusKdsEnableOrderTracking !== false,
    chowbusKdsTrackingUpdateInterval: settings.chowbusKdsTrackingUpdateInterval || 10,
    chowbusKdsShowOrderStatus: settings.chowbusKdsShowOrderStatus !== false,
    chowbusKdsStatusStages: settings.chowbusKdsStatusStages || ['assigned', 'picked', 'in-transit', 'delivered'],
    chowbusKdsEnableProofOfDelivery: settings.chowbusKdsEnableProofOfDelivery !== false,
    chowbusKdsProofTypes: settings.chowbusKdsProofTypes || ['photo', 'signature'],
    chowbusKdsProofRequired: settings.chowbusKdsProofRequired !== false,
    chowbusKdsEnableDeliveryNotes: settings.chowbusKdsEnableDeliveryNotes !== false,
    chowbusKdsDeliveryNotesRequired: settings.chowbusKdsDeliveryNotesRequired !== false,
    chowbusKdsEnableCustomerContact: settings.chowbusKdsEnableCustomerContact !== false,
    chowbusKdsContactOnDelay: settings.chowbusKdsContactOnDelay !== false,
    chowbusKdsContactMethods: settings.chowbusKdsContactMethods || ['call', 'sms'],
    chowbusKdsEnableSmsNotifications: settings.chowbusKdsEnableSmsNotifications !== false,
    chowbusKdsSmsTemplate: settings.chowbusKdsSmsTemplate || 'Your order is on the way!',
    chowbusKdsEnableEmailNotifications: settings.chowbusKdsEnableEmailNotifications !== false,
    chowbusKdsEmailTemplate: settings.chowbusKdsEmailTemplate || 'Order status update',
    chowbusKdsEnablePushNotifications: settings.chowbusKdsEnablePushNotifications !== false,
    chowbusKdsNotificationTriggers: settings.chowbusKdsNotificationTriggers || ['assigned', 'picked', 'delivered'],
    chowbusKdsEnableReporting: settings.chowbusKdsEnableReporting !== false,
    chowbusKdsReportMetrics: settings.chowbusKdsReportMetrics || ['on-time', 'delivery-time', 'customer-rating'],
    chowbusKdsReportSchedule: settings.chowbusKdsReportSchedule || 'daily',
    chowbusKdsEnableAnalytics: settings.chowbusKdsEnableAnalytics !== false,
    chowbusKdsAnalyticsRetention: settings.chowbusKdsAnalyticsRetention || 90,
    chowbusKdsShowAnalyticsDashboard: settings.chowbusKdsShowAnalyticsDashboard !== false,
    // Error Tracking & Logging
    enableErrorTracking: settings.enableErrorTracking !== false,
    autoSaveLogs: settings.autoSaveLogs !== false,
    logRetentionDays: settings.logRetentionDays || 30,
    enableCrashDetection: settings.enableCrashDetection !== false,
    crashReportEmail: settings.crashReportEmail || '',
    logLevel: settings.logLevel || 'error',
    // Tab-specific settings
    orders: settings.orders || { enabled: true, autoRefresh: true, showTokens: true },
    dashboard: settings.dashboard || { enabled: true, showStats: true, showCharts: true },
    reports: settings.reports || { enabled: true, autoGenerate: false, reportTime: '23:00' },
    crm: settings.crm || { enabled: true, showLoyalty: true, allowGuestCheckout: true },
    staff: settings.staff || { enabled: true, showPerformance: true, allowSchedule: true },
    menu: settings.menu || { enabled: true, showImages: true, allowCustomItems: true },
    // Menu layout settings
    menuLayout: settings.menuLayout || {
      viewMode: 'grid',
      gridColumns: 'auto',
      style: 'clean',
      showImages: true,
      showDescriptions: true,
      showCategoryLabels: true,
      showStockBadges: true,
      showVegNonVeg: true,
      spacing: 'medium',
      borderRadius: 'medium',
      shadow: 'subtle'
    },
    inventory: settings.inventory || { enabled: true, lowStockAlert: true, autoReorder: false },
    recipes: settings.recipes || { enabled: true, showCost: true, showYield: true },
    waste: settings.waste || { enabled: true, requireReason: true, trackCost: true },
    reservations: settings.reservations || { enabled: true, autoConfirm: false, maxAdvanceDays: 30 },
    tokens: settings.tokens || { enabled: false, prefix: 'T', autoReset: true },
    tables: settings.tables || { 
      enabled: true, 
      showCapacity: true, 
      allowMerge: true,
      autoClearOnPayment: false,
      requireStaffAssignment: false,
      defaultCapacity: 4,
      tableTimeout: 0,
      showOccupiedTime: true,
      enableQRGeneration: true,
      allowUnassignedSeating: true,
      showTableAnalytics: true,
      sessionTracking: true,
      maxMergeTables: 4,
      tableNumbering: 'T',
      elapsedThresholdWarning: 30,
      elapsedThresholdCritical: 60,
      upcomingReservationWindow: 120
    },
    waiters: settings.waiters || { enabled: true, showAssignedOrders: true, allowCallWaiter: true },
    kitchen: settings.kitchen || { enabled: true, showTimers: true, autoPrintKOT: true },
    onlineOrdering: settings.onlineOrdering || { enabled: false, autoAccept: false, preparationTime: 30 },
    qrOrdering: settings.qrOrdering || { enabled: false, autoAccept: false, showMenuImages: true }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [stations, setStations] = useState([
    { id: KitchenStation.BAKERY, name: 'Bakery', enabled: true, printer: null },
    { id: KitchenStation.KITCHEN, name: 'Kitchen', enabled: true, printer: null },
    { id: KitchenStation.BEVERAGE, name: 'Beverage', enabled: true, printer: null },
    { id: KitchenStation.DESSERT, name: 'Dessert', enabled: true, printer: null },
    { id: KitchenStation.GRILL, name: 'Grill', enabled: false, printer: null },
    { id: KitchenStation.FRYER, name: 'Fryer', enabled: false, printer: null },
    { id: KitchenStation.COLD, name: 'Cold', enabled: false, printer: null },
    { id: KitchenStation.GENERAL, name: 'General', enabled: true, printer: null }
  ]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('storeLogo', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Station configuration functions
  const toggleStation = (stationId) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const updateStationPrinter = (stationId, printer) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, printer } : s
    ));
  };

  const saveStationConfiguration = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cafeos_kitchen_stations', JSON.stringify(stations));
      alert('Station configuration saved!');
    } catch (error) {
      console.error('Error saving station configuration:', error);
      alert('Failed to save station configuration');
    }
  };

  const loadStationConfiguration = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('cafeos_kitchen_stations');
      if (saved) {
        setStations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading station configuration:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadStationConfiguration();
    }
  }, []);

  // Helper function for station icons
  const getStationIcon = (stationId) => {
    const icons = {
      [KitchenStation.BAKERY]: '🥐',
      [KitchenStation.KITCHEN]: '🍳',
      [KitchenStation.BEVERAGE]: '☕',
      [KitchenStation.DESSERT]: '🍰',
      [KitchenStation.GRILL]: '🥩',
      [KitchenStation.FRYER]: '🍟',
      [KitchenStation.COLD]: '🥗',
      [KitchenStation.GENERAL]: '🍽️'
    };
    return icons[stationId] || '🍽️';
  };

  const generateCode = (index, codeType) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    switch (codeType) {
      case 'numeric':
        return String(index + 101);
      case 'alphabetic':
        const first = letters[Math.floor(index / 26) % 26];
        const second = letters[index % 26];
        return first + second;
      case 'alphanumeric':
      default:
        const alphaIndex = Math.floor(index / 10);
        const numIndex = index % 10;
        const letter = letters[alphaIndex % 26];
        return letter + numIndex;
    }
  };

  const updateMenuCodes = (newCodeType) => {
    const updatedMenuItems = menuItems.map((item, index) => ({
      ...item,
      code: generateCode(index, newCodeType)
    }));
    setMenuItems(updatedMenuItems);
  };

  const handleSave = () => {
    setSettings(formData);
    const oldCodeType = settings.codeType;
    const newCodeType = formData.codeType;
    
    // If code type changed, update all menu item codes
    if (oldCodeType !== newCodeType) {
      updateMenuCodes(newCodeType);
    }

    // Sync QR settings to localStorage so the HTML ordering page can read them
    if (typeof window !== 'undefined') {
      try {
        const qrConfig = {
          enabled: formData.qrOrderingEnabled,
          restaurantName: formData.qrRestaurantName || formData.storeName,
          welcomeMessage: formData.qrWelcomeMessage,
          gstRate: Number(formData.qrGstRate) || 18,
          splitGst: formData.qrSplitGst,
          allowSpecialRequests: formData.qrAllowSpecialRequests,
          autoAcceptOrders: formData.qrAutoAcceptOrders,
          showItemDescriptions: formData.qrShowItemDescriptions,
          showCategoryFilter: formData.qrShowCategoryFilter,
          showSearch: formData.qrShowSearch,
          allowCallWaiter: formData.qrAllowCallWaiter,
          primaryColor: formData.qrPrimaryColor,
          accentColor: formData.qrAccentColor,
          googleReviewUrl: formData.googleReviewUrl || '',
          storeName: formData.storeName,
          storeAddress: formData.storeAddress,
          // Receipt controls
          receiptFooter: formData.qrReceiptFooter || formData.receiptFooter || '',
          showReceiptOnOrder: formData.qrShowReceiptOnOrder,
          receiptShowFssai: formData.qrReceiptShowFssai,
          receiptShowTariff: formData.qrReceiptShowTariff,
          receiptShowReviewQr: formData.qrReceiptShowReviewQr,
          // Pass through licence/compliance fields
          gstin: formData.gstin,
          fssaiLicense: formData.fssaiLicense,
          tariffCode: formData.tariffCode,
          phone: formData.phone,
          // Payment controls
          enablePaymentCash: formData.qrEnablePaymentCash,
          enablePaymentUPI: formData.qrEnablePaymentUPI,
          enablePaymentCard: formData.qrEnablePaymentCard,
          // Tipping controls
          enableTipping: formData.qrEnableTipping,
          defaultTipPercent: formData.qrDefaultTipPercent,
          tipOptions: formData.qrTipOptions,
          // Customization controls
          enableSizeOptions: formData.qrEnableSizeOptions,
          enableSpiceOptions: formData.qrEnableSpiceOptions,
          enableAddons: formData.qrEnableAddons,
          addonCheesePrice: formData.qrAddonCheesePrice,
          addonSaucePrice: formData.qrAddonSaucePrice,
          sizeLargePrice: formData.qrSizeLargePrice,
          // Order management
          enableOrderCancel: formData.qrEnableOrderCancel,
          enableDarkMode: formData.qrEnableDarkMode,
          enableCombos: formData.qrEnableCombos,
          enableSplitBilling: formData.qrEnableSplitBilling,
          // Session & Business Hours
          sessionTimeout: formData.qrSessionTimeout,
          enableBusinessHours: formData.qrEnableBusinessHours,
          businessHoursStart: formData.qrBusinessHoursStart,
          businessHoursEnd: formData.qrBusinessHoursEnd,
          closedMessage: formData.qrClosedMessage,
          // GST & Invoice
          gstRoundingMode: formData.qrGstRoundingMode,
          enableSequentialInvoices: formData.qrEnableSequentialInvoices,
          invoicePrefix: formData.qrInvoicePrefix,
          invoiceStartNumber: formData.qrInvoiceStartNumber,
          lastInvoiceNumber: formData.qrLastInvoiceNumber,
          // Printer
          enableThermalPrinter: formData.qrEnableThermalPrinter,
          printerPort: formData.qrPrinterPort,
          printerPaperWidth: formData.qrPrinterPaperWidth,
          // Email settings for receipts
          brevoApiKey: formData.brevoApiKey || '',
          storeEmail: formData.storeEmail || ''
        };
        localStorage.setItem('qr_settings', JSON.stringify(qrConfig));
      } catch (e) { console.error('Failed to sync QR settings', e); }
    }

    // Save menu layout settings to localStorage
    try {
      if (formData.menuLayout) {
        localStorage.setItem('menu_layout_settings', JSON.stringify(formData.menuLayout));
      }
    } catch (e) { console.error('Failed to save menu layout settings', e); }

    // Save kitchen Oracle KDS and Split KDS setting to localStorage
    try {
      const existingSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      existingSettings.kitchen = existingSettings.kitchen || {};
      localStorage.setItem('cafeos_settings', JSON.stringify(existingSettings));
    } catch (e) { console.error('Failed to save kitchen settings', e); }

    setHasChanges(false);
    setAlertMessage('Settings saved successfully!');
    setAlertType('success');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleBackup = () => {
    const backupData = {
      settings: formData,
      menuItems: menuItems || [],
      inventory: inventory || [],
      customers: customers || [],
      orders: orders || [],
      staff: staff || [],
      tables: tables || [],
      backupDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakerypos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (confirm('This will replace all current data with the backup. Are you sure you want to continue?')) {
          if (backupData.settings) setSettings(backupData.settings);
          if (backupData.menuItems) setMenuItems(backupData.menuItems);
          if (backupData.inventory) setInventory(backupData.inventory);
          if (backupData.customers) setCustomers(backupData.customers);
          if (backupData.orders) setOrders(backupData.orders);
          if (backupData.staff) setStaff(backupData.staff);
          if (backupData.tables) setTables(backupData.tables);
          
          alert('Backup restored successfully!');
        }
      } catch (error) {
        alert('Error restoring backup: Invalid backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleReset = () => {
    setFormData({
      storeName: settings.storeName || '',
      storeAddress: settings.storeAddress || '',
      autoPrintReceipt: settings.autoPrintReceipt !== false,
      kitchenDisplayEnabled: settings.kitchenDisplayEnabled !== false,
      showTokensOnOrders: settings.showTokensOnOrders !== false,
      groupByTable: settings.groupByTable !== false,
      showOrderTime: settings.showOrderTime !== false,
      showCustomerName: settings.showCustomerName !== false,
      autoRefreshOrders: settings.autoRefreshOrders !== false,
      allowOrderEdit: settings.allowOrderEdit !== false,
      allowOrderSplit: settings.allowOrderSplit !== false,
      showOrderTotal: settings.showOrderTotal !== false,
      qrOrderingEnabled: settings.qrOrderingEnabled !== false,
      // QR Receipt controls
      qrReceiptFooter: settings.qrReceiptFooter || '',
      qrShowReceiptOnOrder: settings.qrShowReceiptOnOrder !== false,
      qrReceiptShowFssai: settings.qrReceiptShowFssai !== false,
      qrReceiptShowTariff: settings.qrReceiptShowTariff !== false,
      qrReceiptShowReviewQr: settings.qrReceiptShowReviewQr !== false,
      theme: settings.theme || 'light',
      orderTimeout: settings.orderTimeout || '30',
      lowStockAlert: settings.lowStockAlert !== false,
      dailyReportTime: settings.dailyReportTime || '23:00',
      enableNotifications: settings.enableNotifications !== false,
      gstin: settings.gstin || '',
      gstRegistered: settings.gstRegistered !== false,
      fssaiLicense: settings.fssaiLicense || '',
      tariffCode: settings.tariffCode || '',
      googleReviewUrl: settings.googleReviewUrl || '',
      dataRetentionDays: settings.dataRetentionDays || '365',
      posMode: settings.posMode || 'basic',
      receiptTemplate: settings.receiptTemplate || 'standard',
      customReceiptHeader: settings.customReceiptHeader || '',
      customReceiptFooter: settings.customReceiptFooter || '',
      showLogoOnReceipt: settings.showLogoOnReceipt !== false,
      showGstOnReceipt: settings.showGstOnReceipt !== false,
      showTableOnReceipt: settings.showTableOnReceipt !== false,
      showCustomerOnReceipt: settings.showCustomerOnReceipt !== false,
      receiptFontSize: settings.receiptFontSize || '12',
      // Workflow settings
      requireCustomer: settings.requireCustomer || false,
      requireTable: settings.requireTable || false,
      allowWalkIn: settings.allowWalkIn !== false,
      requirePaymentBeforeKOT: settings.requirePaymentBeforeKOT || false,
      autoCreateKOT: settings.autoCreateKOT !== false,
      allowedPaymentMethods: settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI', 'UPI_QR', 'SPLIT'],
      enableSplitPayment: settings.enableSplitPayment !== false,
      maxSplitPayments: settings.maxSplitPayments || 5,
      enableDiscount: settings.enableDiscount !== false,
      maxDiscountPercent: settings.maxDiscountPercent || 50,
      requireManagerForHighDiscount: settings.requireManagerForHighDiscount || false,
      highDiscountThreshold: settings.highDiscountThreshold || 20,
      enableHoldOrders: settings.enableHoldOrders === true,
      maxHoldOrders: settings.maxHoldOrders || 10,
      holdOrderTimeout: settings.holdOrderTimeout || 60,
      enableCustomOrders: settings.enableCustomOrders !== false,
      requireApprovalForCustomOrders: settings.requireApprovalForCustomOrders || false,
      enableVoid: settings.enableVoid !== false,
      requireManagerForVoid: settings.requireManagerForVoid || false,
      enableOrderNotes: settings.enableOrderNotes !== false,
      requireNotesForCustomOrders: settings.requireNotesForCustomOrders || false,
      workflowSteps: settings.workflowSteps || ['items', 'customer', 'table', 'payment'],
      autoPrintKOT: settings.autoPrintKOT !== false,
      kotPrintStations: settings.kotPrintStations || ['kitchen', 'bar'],
      enableTokenSystem: settings.enableTokenSystem !== false,
      tokenPrefix: settings.tokenPrefix || 'T',
      autoAssignTables: settings.autoAssignTables || false,
      // Order card column settings
      orderCardColumn_table:        settings.orderCardColumn_table !== false,
      orderCardColumn_time:         settings.orderCardColumn_time !== false,
      orderCardColumn_customer:     settings.orderCardColumn_customer !== false,
      orderCardColumn_categories:  settings.orderCardColumn_categories !== false,
      orderCardColumn_items:        settings.orderCardColumn_items !== false,
      orderCardColumn_total:        settings.orderCardColumn_total !== false,
      orderCardColumn_status:       settings.orderCardColumn_status !== false,
      // Receipt additional fields
      storeLogo: settings.storeLogo || '',
      cashierName: settings.cashierName || '',
      showCashierOnReceipt: settings.showCashierOnReceipt !== false,
      showEmailOnReceipt: settings.showEmailOnReceipt !== false,
      showPaymentDetailsOnReceipt: settings.showPaymentDetailsOnReceipt !== false,
      showBillIdOnReceipt: settings.showBillIdOnReceipt !== false,
      enableAutoRefund: settings.enableAutoRefund || false,
      refundTimeLimit: settings.refundTimeLimit || 24,
      // PCI DSS Compliance
      enablePciDssLogging: settings.enablePciDssLogging || false,
      enableCardTokenization: settings.enableCardTokenization !== false,
      requireCvvForSavedCards: settings.requireCvvForSavedCards || false,
      cardDataRetentionDays: settings.cardDataRetentionDays || 30,
      // GDPR Compliance
      enableGdprCompliance: settings.enableGdprCompliance !== false,
      requireDataConsent: settings.requireDataConsent || false,
      enableRightToDeletion: settings.enableRightToDeletion !== false,
      customerDataRetentionDays: settings.customerDataRetentionDays || 365,
      // Security Settings
      enableEncryption: settings.enableEncryption !== false,
      enableAuditLog: settings.enableAuditLog !== false,
      sessionTimeout: settings.sessionTimeout || 30,
      brevoApiKey: settings.brevoApiKey || '',
      storeEmail: settings.storeEmail || ''
    });
    setHasChanges(false);
  };

  const sections = [
    { 
      group: 'General',
      items: [
        { id: 'general', label: 'General', icon: '⚙️', description: 'Store info, business hours, tax, regional settings' },
        { id: 'display', label: 'Display', icon: '🖥️', description: 'Screen layout, density, animations' },
        { id: 'themes', label: 'Themes', icon: '🎨', description: 'Color schemes, dark mode, custom colors' },
        { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Alerts, sounds, notification preferences' }
      ]
    },
    { 
      group: 'Devices',
      items: [
        { id: 'mobileui', label: 'Mobile & Tablet UI', icon: '📱', description: 'Bottom bar, nav style, icons, tablet sidebar' }
      ]
    },
    { 
      group: 'Business',
      items: [
        { id: 'business', label: 'Business', icon: '🏪', description: 'Business info, hours, contact details' },
        { id: 'tax', label: 'Tax & Pricing', icon: '💰', description: 'Tax rates, service charges, pricing rules' }
      ]
    },
    { 
      group: 'Tabs',
      items: [
        { id: 'tab-dashboard', label: 'Dashboard', icon: '📊', description: 'Dashboard visibility, widgets, metrics' },
        { id: 'tab-reports', label: 'Reports', icon: '📈', description: 'Report generation, export, scheduling' },
        { id: 'tab-crm', label: 'CRM', icon: '👥', description: 'Customer management, loyalty, history' },
        { id: 'tab-staff', label: 'Staff', icon: '👨‍🍳', description: 'Staff roles, permissions, scheduling' },
        { id: 'tab-menu', label: 'Menu', icon: '🍽️', description: 'Menu layout, categories, display' },
        { id: 'tab-inventory', label: 'Inventory', icon: '📦', description: 'Stock tracking, alerts, restocking' },
        { id: 'tab-recipes', label: 'Recipes', icon: '📝', description: 'Recipe management, costing, prep time' },
        { id: 'tab-waste', label: 'Waste', icon: '🗑️', description: 'Waste tracking, reasons, reporting' },
        { id: 'tab-reservations', label: 'Reservations', icon: '📅', description: 'Booking system, deposits, cancellations' },
        { id: 'tab-tokens', label: 'Tokens', icon: '🎫', description: 'Token system, numbering, display' },
        { id: 'tab-tables', label: 'Tables', icon: '🪑', description: 'Table management, reservations, layout' },
        { id: 'tab-waiters', label: 'Waiters', icon: '🛎️', description: 'Waiter calls, notifications, response' },
        { id: 'tab-kitchen', label: 'Kitchen', icon: '👨‍🍳', description: 'KDS, stations, routing, timers' },
        { id: 'tab-online', label: 'Online Ordering', icon: '🌐', description: 'Online platform, delivery, integration' }
      ]
    },
    { 
      group: 'Toast & KDS',
      items: [
        { id: 'toast-orders', label: 'Toast Orders', icon: '🍞', description: 'Toast POS configuration, workflow, display' },
        { id: 'oracle-kds', label: 'Oracle KDS', icon: '🔮', description: 'Oracle KDS settings, layout, routing' },
        { id: 'split-kds', label: 'Split KDS', icon: '🔀', description: 'Split KDS configuration, item splitting' },
        { id: 'chowbus-kds', label: 'Chowbus KDS', icon: '🚌', description: 'Chowbus KDS settings, bus management' }
      ]
    },
    { 
      group: 'POS & Workflows',
      items: [
        { id: 'pos', label: 'POS Settings', icon: '🛒', description: 'Order workflow, checkout, printing' },
        { id: 'workflow', label: 'Workflow Rules', icon: '⚡', description: 'Automation, approvals, routing' },
        { id: 'itemcodes', label: 'Item Codes', icon: '🔢', description: 'Code generation, formats, scanning' }
      ]
    },
    { 
      group: 'Receipts & Design',
      items: [
        { id: 'receipt_studio', label: 'Receipt Studio', icon: '🎨', description: 'Custom receipt design, preview, templates' }
      ]
    },
    { 
      group: 'Operations',
      items: [
        { id: 'kitchen', label: 'Kitchen Ops', icon: '👨‍🍳', description: 'Kitchen display, KDS auto-print, timing' },
        { id: 'qr', label: 'QR Ordering', icon: '📱', description: 'QR code setup, mobile ordering, payment' }
      ]
    },
    { 
      group: 'System',
      items: [
        { id: 'backup', label: 'Backup & Restore', icon: '💾', description: 'Data backup, restore, scheduling' },
        { id: 'refunds', label: 'Refunds', icon: '💸', description: 'Refund policies, processing, limits' },
        { id: 'compliance', label: 'Roles & Security', icon: '🔒', description: 'User roles, permissions, security' },
        { id: 'debug', label: 'Debug & Logs', icon: '🐛', description: 'System logs, debugging, diagnostics' }
      ]
    }
  ];

  const activeSectionMeta = useMemo(() => {
    for (const group of sections) {
      const found = group.items.find(item => item.id === activeSection);
      if (found) return found;
    }
    // Handle tab-specific sections
    if (activeSection.startsWith('tab-')) {
      const tabId = activeSection.replace('tab-', '');
      const tabConfig = {
        'orders': { icon: '🛒', label: 'Orders', description: 'Order management, history, workflows' },
        'dashboard': { icon: '📊', label: 'Dashboard', description: 'Dashboard visibility, widgets, metrics' },
        'reports': { icon: '📈', label: 'Reports', description: 'Report generation, export, scheduling' },
        'crm': { icon: '👥', label: 'CRM', description: 'Customer management, loyalty, history' },
        'staff': { icon: '👨‍🍳', label: 'Staff', description: 'Staff roles, permissions, scheduling' },
        'menu': { icon: '🍽️', label: 'Menu', description: 'Menu layout, categories, display' },
        'inventory': { icon: '📦', label: 'Inventory', description: 'Stock tracking, alerts, restocking' },
        'recipes': { icon: '📝', label: 'Recipes', description: 'Recipe management, costing, prep time' },
        'waste': { icon: '🗑️', label: 'Waste', description: 'Waste tracking, reasons, reporting' },
        'reservations': { icon: '📅', label: 'Reservations', description: 'Booking system, deposits, cancellations' },
        'tokens': { icon: '🎫', label: 'Tokens', description: 'Token system, numbering, display' },
        'tables': { icon: '🪑', label: 'Tables', description: 'Table management, reservations, layout' },
        'waiters': { icon: '🛎️', label: 'Waiters', description: 'Waiter calls, notifications, response' },
        'kitchen': { icon: '👨‍🍳', label: 'Kitchen', description: 'KDS, stations, routing, timers' },
        'online': { icon: '🌐', label: 'Online Ordering', description: 'Online platform, delivery, integration' },
        'toast-orders': { icon: '🍞', label: 'Toast Orders', description: 'Toast POS configuration, workflow' },
        'oracle-kds': { icon: '🔮', label: 'Oracle KDS', description: 'Oracle KDS settings, layout' },
        'split-kds': { icon: '🔀', label: 'Split KDS', description: 'Split KDS configuration' },
        'chowbus-kds': { icon: '🚌', label: 'Chowbus KDS', description: 'Chowbus KDS settings' }
      };
      return tabConfig[tabId] || { icon: '⚙️', label: 'Settings', description: 'System configuration' };
    }
    return { icon: '⚙️', label: 'Settings' };
  }, [activeSection]);

  const ReceiptPreview = ({ settings }) => {
    const sampleOrder = {
      id: 'ORD-001',
      token: 'T001',
      billId: 'BILL-2024-0819-001',
      date: new Date().toLocaleString(),
      items: [
        { name: 'Sample Item 1', quantity: 2, price: 150 },
        { name: 'Sample Item 2', quantity: 1, price: 200 }
      ],
      subtotal: 500,
      tax: 90,
      total: 590,
      paymentMethod: 'CASH',
      paymentType: 'CASH',
      paymentEntry: 'POS Terminal 1',
      paymentStatus: 'COMPLETED',
      table: 'T-05',
      customer: 'John Doe',
      cashier: settings.cashierName || 'Staff Member'
    };

    const renderHeader = () => {
      if (settings.receiptTemplate === 'custom' && settings.customReceiptHeader) {
        return (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            {settings.customReceiptHeader}
          </div>
        );
      }
      
      return (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          {settings.showLogoOnReceipt && settings.storeLogo && (
            <img 
              src={settings.storeLogo} 
              alt="Store Logo" 
              style={{ maxWidth: '80px', maxHeight: '80px', marginBottom: '8px' }}
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) + 4}px`, fontWeight: 'bold' }}>
              {settings.storeName || 'My Store'}
            </div>
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.storeAddress || '123 Main St'}
            </div>
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.phone || '+91 9876543210'}
            </div>
          )}
          {settings.showEmailOnReceipt && settings.email && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.email}
            </div>
          )}
        </div>
      );
    };

    const renderFooter = () => {
      if (settings.receiptTemplate === 'custom' && settings.customReceiptFooter) {
        return (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
            {settings.customReceiptFooter}
          </div>
        );
      }
      
      return (
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
          <div>{settings.receiptFooter || 'Thank you for visiting!'}</div>
          {settings.gstin && <div>GSTIN: {settings.gstin}</div>}
          {settings.fssaiLicense && <div>FSSAI: {settings.fssaiLicense}</div>}
          {settings.showBillIdOnReceipt && <div>Bill ID: {sampleOrder.billId}</div>}
        </div>
      );
    };

    const baseStyle = {
      fontFamily: 'monospace',
      fontSize: `${settings.receiptFontSize}px`,
      lineHeight: '1.4',
      color: '#000',
      padding: '16px',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      maxWidth: '280px',
      margin: '0 auto'
    };

    const thermalStyle = {
      ...baseStyle,
      maxWidth: '240px',
      fontSize: `${parseInt(settings.receiptFontSize) - 2}px`
    };

    const simpleStyle = {
      ...baseStyle,
      padding: '12px'
    };

    const containerStyle = settings.receiptTemplate === 'thermal' ? thermalStyle : 
                          settings.receiptTemplate === 'simple' ? simpleStyle : baseStyle;

    return (
      <div style={containerStyle}>
        {renderHeader()}
        
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Order #: {sampleOrder.id}</span>
            {settings.receiptTemplate !== 'simple' && <span>Token: {sampleOrder.token}</span>}
          </div>
          <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>{sampleOrder.date}</div>
          {settings.showTableOnReceipt && <div>Table: {sampleOrder.table}</div>}
          {settings.showCustomerOnReceipt && <div>Customer: {sampleOrder.customer}</div>}
          {settings.showCashierOnReceipt && <div>Cashier: {sampleOrder.cashier}</div>}
        </div>

        <div style={{ marginBottom: '8px' }}>
          {sampleOrder.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <div>{item.name}</div>
                <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
                  {item.quantity} x ₹{item.price}
                </div>
              </div>
              <div>₹{item.quantity * item.price}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{sampleOrder.subtotal}</span>
          </div>
          {settings.showGstOnReceipt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GST ({settings.taxRate || 18}%):</span>
              <span>₹{sampleOrder.tax}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>₹{sampleOrder.total}</span>
          </div>
          <div style={{ marginTop: '4px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
            Paid: {sampleOrder.paymentMethod}
          </div>
          {settings.showPaymentDetailsOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              <div>Type: {sampleOrder.paymentType}</div>
              <div>Entry: {sampleOrder.paymentEntry}</div>
              <div>Status: {sampleOrder.paymentStatus}</div>
            </div>
          )}
        </div>

        {renderFooter()}
      </div>
    );
  };

  // Theme colors
  const t = {
    bg:       darkMode ? '#000000' : '#f5f7fa',
    bgEle:    darkMode ? '#0a0a0a' : '#ffffff',
    bgCard:   darkMode ? '#111111' : '#ffffff',
    bgInput:  darkMode ? '#000000' : '#f8fafc',
    border:   darkMode ? '#222222' : '#d1d5db',
    text:     darkMode ? '#ffffff' : '#0a0a0a',
    textSub:  darkMode ? '#e0e0e0' : '#222222',
    textMute: darkMode ? '#888888' : '#6b7280',
    accent:   '#6366f1',
  };

  /* ─── Mobile: are we showing the list or a section detail? ─────── */
  const isMobileList = screenSize === 'small' && activeSection === '__list__';

  /* On first render on mobile, show the list, not a section */
  React.useEffect(() => {
    if (screenSize === 'small' && activeSection !== '__list__' && !_mobileEnteredSection.current) {
      // keep whatever section was saved; user navigated here intentionally
    }
  }, [screenSize]); // eslint-disable-line

  const _mobileEnteredSection = React.useRef(false);

  const handleMobileNav = (id) => {
    _mobileEnteredSection.current = true;
    setActiveSection(id);
  };

  // When we mount on mobile, default to the list view if no section was previously chosen
  React.useEffect(() => {
    if (screenSize === 'small' && !_mobileEnteredSection.current && activeSection === 'general') {
      setActiveSection('__list__');
    }
    // eslint-disable-next-line
  }, []);


  const renderSectionContent = () => (
    <>
      {activeSection === 'receipt_studio' && (
        <ReceiptStudioPanel
          formData={formData}
          handleInputChange={handleInputChange}
          darkMode={darkMode}
          screenSize={screenSize}
        />
      )}
      {activeSection === 'workflow' && (
        <WorkflowEnginePanel
          formData={formData}
          handleInputChange={handleInputChange}
          darkMode={darkMode}
        />
      )}
      {activeSection === 'compliance' && (
        <RoleSecurityPanel
          formData={formData}
          handleInputChange={handleInputChange}
          darkMode={darkMode}
        />
      )}
      {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Store Information */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🏪 Store Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Business Type
                      </label>
                      <select
                        value={formData.businessType || 'restaurant'}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                        <option value="bakery">Bakery</option>
                        <option value="fast_food">Fast Food</option>
                        <option value="fine_dining">Fine Dining</option>
                        <option value="bar">Bar/Pub</option>
                        <option value="food_truck">Food Truck</option>
                        <option value="catering">Catering Service</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact || ''}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin || ''}
                        onChange={(e) => handleInputChange('gstin', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber || ''}
                        onChange={(e) => handleInputChange('panNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: screenSize === 'small' ? '1' : '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Store Address
                      </label>
                      <input
                        type="text"
                        value={formData.storeAddress}
                        onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: screenSize === 'small' ? '1' : '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Manager Name
                      </label>
                      <input
                        type="text"
                        value={formData.managerName || ''}
                        onChange={(e) => handleInputChange('managerName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Configuration */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🏢 Business Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Total Tables
                      </label>
                      <input
                        type="number"
                        value={formData.totalTables || 20}
                        onChange={(e) => handleInputChange('totalTables', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        value={formData.seatingCapacity || 80}
                        onChange={(e) => handleInputChange('seatingCapacity', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Maximum Order Value
                      </label>
                      <input
                        type="number"
                        value={formData.maxOrderValue || 100000}
                        onChange={(e) => handleInputChange('maxOrderValue', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Minimum Order Value
                      </label>
                      <input
                        type="number"
                        value={formData.minOrderValue || 100}
                        onChange={(e) => handleInputChange('minOrderValue', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Business Hours */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🕐 Business Hours
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Default Opening Time
                      </label>
                      <input
                        type="time"
                        value={formData.openingTime || '09:00'}
                        onChange={(e) => handleInputChange('openingTime', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Default Closing Time
                      </label>
                      <input
                        type="time"
                        value={formData.closingTime || '23:00'}
                        onChange={(e) => handleInputChange('closingTime', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Timezone
                      </label>
                      <select
                        value={formData.timezone || 'Asia/Kolkata'}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="Asia/Kolkata">India (IST)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="America/Los_Angeles">Los Angeles (PST)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Singapore">Singapore (SGT)</option>
                        <option value="Australia/Sydney">Sydney (AEST)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Operating Days
                      </label>
                      <select
                        value={formData.operatingDays || 'all'}
                        onChange={(e) => handleInputChange('operatingDays', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="all">All Days</option>
                        <option value="weekdays">Weekdays Only</option>
                        <option value="weekends">Weekends Only</option>
                        <option value="custom">Custom Schedule</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Advanced Tax & Pricing */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    💰 Tax & Pricing
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.taxRate}
                        onChange={(e) => handleInputChange('taxRate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Tax Type
                      </label>
                      <select
                        value={formData.taxType || 'gst'}
                        onChange={(e) => handleInputChange('taxType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="gst">GST</option>
                        <option value="vat">VAT</option>
                        <option value="sales_tax">Sales Tax</option>
                        <option value="service_tax">Service Tax</option>
                        <option value="none">No Tax</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Service Charge (%)
                      </label>
                      <input
                        type="number"
                        value={formData.serviceCharge || 0}
                        onChange={(e) => handleInputChange('serviceCharge', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Service Charge Type
                      </label>
                      <select
                        value={formData.serviceChargeType || 'optional'}
                        onChange={(e) => handleInputChange('serviceChargeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="optional">Optional</option>
                        <option value="mandatory">Mandatory</option>
                        <option value="dine_in_only">Dine-in Only</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Rounding Method
                      </label>
                      <select
                        value={formData.roundingMethod || 'nearest'}
                        onChange={(e) => handleInputChange('roundingMethod', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="nearest">Nearest</option>
                        <option value="up">Round Up</option>
                        <option value="down">Round Down</option>
                        <option value="none">No Rounding</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Decimal Places
                      </label>
                      <select
                        value={formData.decimalPlaces || '2'}
                        onChange={(e) => handleInputChange('decimalPlaces', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="0">0 (No decimals)</option>
                        <option value="1">1 (₹100.0)</option>
                        <option value="2">2 (₹100.00)</option>
                        <option value="3">3 (₹100.000)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Regional Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🌍 Regional Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="CNY">CNY (¥)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ar">Arabic</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Date Format
                      </label>
                      <select
                        value={formData.dateFormat || 'DD/MM/YYYY'}
                        onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Time Format
                      </label>
                      <select
                        value={formData.timeFormat || '24h'}
                        onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="24h">24 Hour (14:30)</option>
                        <option value="12h">12 Hour (2:30 PM)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Number Format
                      </label>
                      <select
                        value={formData.numberFormat || 'indian'}
                        onChange={(e) => handleInputChange('numberFormat', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="indian">Indian (1,00,000.00)</option>
                        <option value="international">International (100,000.00)</option>
                        <option value="european">European (100.000,00)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, marginTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Color-Blind Mode</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Use patterns and icons instead of just colors for status</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('colorBlindMode', !formData.colorBlindMode)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.colorBlindMode ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.colorBlindMode ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick-link card to Mobile & Tablet UI section */}
                <button
                  onClick={() => setActiveSection('mobileui')}
                  style={{
                    padding: '16px 20px',
                    background: darkMode ? '#111111' : '#f9fafb',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? '#222222' : '#e5e7eb'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>Mobile & Tablet UI</div>
                      <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>
                        Bottom bar, nav style, icons, tablet sidebar
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: darkMode ? '#222222' : '#9ca3af' }}>›</span>
                </button>
              </div>
            )}

            {/* Display Settings */}
            {activeSection === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🖥️ Screen Layout
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Screen Density
                      </label>
                      <select
                        value={formData.screenDensity || 'comfortable'}
                        onChange={(e) => handleInputChange('screenDensity', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="spacious">Spacious</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Font Size
                      </label>
                      <select
                        value={formData.fontSize || 'medium'}
                        onChange={(e) => handleInputChange('fontSize', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    ✨ Animations & Effects
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Show Animations</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Enable smooth transitions and animations</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('showAnimations', !formData.showAnimations)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.showAnimations ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.showAnimations ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Animation Speed
                      </label>
                      <select
                        value={formData.animationSpeed || 'normal'}
                        onChange={(e) => handleInputChange('animationSpeed', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="slow">Slow</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Fast</option>
                        <option value="instant">Instant</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🎨 Visual Style
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Border Radius
                      </label>
                      <select
                        value={formData.borderRadius || 'medium'}
                        onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="none">None (Sharp)</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="round">Round</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Show Borders
                      </label>
                      <select
                        value={formData.showBorders !== false ? 'yes' : 'no'}
                        onChange={(e) => handleInputChange('showBorders', e.target.value === 'yes')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Show Shadows</div>
                      <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Add depth with drop shadows</div>
                    </div>
                    <button
                      onClick={() => handleInputChange('showShadows', !formData.showShadows)}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        background: formData.showShadows ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '3px',
                        left: formData.showShadows ? '23px' : '3px',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Themes Settings */}
            {activeSection === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🌓 Theme Mode
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                      Theme Mode
                    </label>
                    <select
                      value={formData.themeMode || 'dark'}
                      onChange={(e) => handleInputChange('themeMode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: darkMode ? '#000000' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#0a0a0a',
                        outline: 'none'
                      }}
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🎨 Custom Colors
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Accent Color
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={formData.accentColor || '#6366f1'}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          style={{
                            width: '50px',
                            height: '40px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <input
                          type="text"
                          value={formData.accentColor || '#6366f1'}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Primary Color
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={formData.primaryColor || '#8b5cf6'}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          style={{
                            width: '50px',
                            height: '40px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <input
                          type="text"
                          value={formData.primaryColor || '#8b5cf6'}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Background Color
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={formData.backgroundColor || '#000000'}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          style={{
                            width: '50px',
                            height: '40px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor || '#000000'}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Card Color
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={formData.cardColor || '#111111'}
                          onChange={(e) => handleInputChange('cardColor', e.target.value)}
                          style={{
                            width: '50px',
                            height: '40px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <input
                          type="text"
                          value={formData.cardColor || '#111111'}
                          onChange={(e) => handleInputChange('cardColor', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔄 Reset Theme
                  </div>
                  <button
                    onClick={() => {
                      handleInputChange('accentColor', '#6366f1');
                      handleInputChange('primaryColor', '#8b5cf6');
                      handleInputChange('backgroundColor', '#000000');
                      handleInputChange('cardColor', '#111111');
                      handleInputChange('textColor', '#ffffff');
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                  >
                    Reset to Default Colors
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔔 Notification Preferences
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Sound Notifications</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Play sounds for important events</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('enableSoundNotifications', !formData.enableSoundNotifications)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableSoundNotifications ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.enableSoundNotifications ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Desktop Notifications</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Show browser notifications</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('enableDesktopNotifications', !formData.enableDesktopNotifications)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableDesktopNotifications ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.enableDesktopNotifications ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔊 Sound Settings
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Notification Sound
                      </label>
                      <select
                        value={formData.notificationSound || 'default'}
                        onChange={(e) => handleInputChange('notificationSound', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="default">Default</option>
                        <option value="chime">Chime</option>
                        <option value="bell">Bell</option>
                        <option value="alert">Alert</option>
                        <option value="gentle">Gentle</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Volume ({formData.notificationVolume || 70}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.notificationVolume || 70}
                        onChange={(e) => handleInputChange('notificationVolume', parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          background: darkMode ? '#222222' : '#d1d5db',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    ⚡ Alert Types
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Order Alerts</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Notify on new orders</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('enableOrderAlerts', !formData.enableOrderAlerts)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableOrderAlerts ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.enableOrderAlerts ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Low Stock Alerts</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Notify when items are low</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('enableLowStockAlerts', !formData.enableLowStockAlerts)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableLowStockAlerts ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.enableLowStockAlerts ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>Payment Alerts</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Notify on payments</div>
                      </div>
                      <button
                        onClick={() => handleInputChange('enablePaymentAlerts', !formData.enablePaymentAlerts)}
                        style={{
                          width: '48px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enablePaymentAlerts ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: formData.enablePaymentAlerts ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'mobileui' && (() => {
              const dm = darkMode;
              const card = {
                padding: '20px',
                background: screenSize === 'small' ? 'transparent' : (dm ? '#111111' : '#f9fafb'),
                borderRadius: '16px',
                border: screenSize === 'small' ? 'none' : `1px solid ${dm ? '#222222' : '#e5e7eb'}`,
                marginBottom: '0',
              };
              const label = {
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: dm ? '#e0e0e0' : '#111111', marginBottom: '8px',
              };
              const hint = { fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '6px' };
              const select = {
                width: '100%',
                padding: screenSize === 'small' ? '14px 16px' : '11px 14px',
                border: `1px solid ${dm ? '#222222' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: screenSize === 'small' ? '16px' : '14px',
                background: dm ? '#000000' : '#ffffff',
                color: dm ? '#ffffff' : '#0a0a0a',
                outline: 'none',
                minHeight: screenSize === 'small' ? '52px' : '44px',
                cursor: 'pointer',
              };
              const toggle = (key) => (
                <div
                  onClick={() => handleInputChange(key, !formData[key])}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px',
                    background: formData[key] ? '#6366f1' : (dm ? '#111111' : '#d1d5db'),
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: formData[key] ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#ffffff', transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }} />
                </div>
              );
              const toggleRow = (key, title, desc) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: dm ? '#000000' : '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${dm ? '#222222' : '#e5e7eb'}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: dm ? '#ffffff' : '#0a0a0a' }}>{title}</div>
                    {desc && <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '3px' }}>{desc}</div>}
                  </div>
                  {toggle(key)}
                </div>
              );

              const ALL_TAB_OPTIONS = [
                { id: 'orders', label: 'Orders', icon: '🛒' },
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'reports', label: 'Reports', icon: '📈' },
                { id: 'crm', label: 'Customers', icon: '👤' },
                { id: 'staff', label: 'Staff', icon: '👥' },
                { id: 'menu', label: 'Menu', icon: '🍽️' },
                { id: 'inventory', label: 'Inventory', icon: '📦' },
                { id: 'tables', label: 'Tables', icon: '🪑' },
                { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ];
              const currentTabs = formData.mobileNavTabs ?? ['orders', 'dashboard', 'reports', 'crm', 'more'];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* ── Section header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '28px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: dm ? '#ffffff' : '#0a0a0a' }}>Mobile & Tablet UI</div>
                      <div style={{ fontSize: '13px', color: dm ? '#6b7280' : '#9ca3af' }}>Customise navigation, icons, and layout for every screen size</div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* PHONE — NAV BAR                               */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#0a0a0a', marginBottom: '16px' }}>
                      📲 Phone Navigation Bar
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Position */}
                      <div>
                        <label style={label}>Bar Position</label>
                        <select
                          value={formData.mobileNavPosition}
                          onChange={e => handleInputChange('mobileNavPosition', e.target.value)}
                          style={select}
                        >
                          <option value="bottom">Bottom (recommended)</option>
                          <option value="top">Top</option>
                        </select>
                        <div style={hint}>Bottom bar is easier to reach on tall phones</div>
                      </div>

                      {/* Style */}
                      <div>
                        <label style={label}>Active Tab Style</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { value: 'pill',      label: 'Pill',       desc: 'Rounded highlight', emoji: '💊' },
                            { value: 'underline', label: 'Underline',  desc: 'Bottom line',        emoji: '📏' },
                            { value: 'icon-only', label: 'Icon Only',  desc: 'No labels, minimal', emoji: '🔹' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleInputChange('mobileNavStyle', opt.value)}
                              style={{
                                padding: '12px 8px',
                                background: formData.mobileNavStyle === opt.value
                                  ? (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                                  : (dm ? '#000000' : '#ffffff'),
                                border: `1.5px solid ${formData.mobileNavStyle === opt.value ? '#6366f1' : (dm ? '#222222' : '#e5e7eb')}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '4px',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: formData.mobileNavStyle === opt.value ? '#6366f1' : (dm ? '#e0e0e0' : '#111111') }}>{opt.label}</span>
                              <span style={{ fontSize: '10px', color: dm ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Icon size */}
                      <div>
                        <label style={label}>Icon Size</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { value: 'sm', label: 'Small',  px: '18px' },
                            { value: 'md', label: 'Medium', px: '22px' },
                            { value: 'lg', label: 'Large',  px: '28px' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleInputChange('mobileIconSize', opt.value)}
                              style={{
                                padding: '12px 8px',
                                background: formData.mobileIconSize === opt.value
                                  ? (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                                  : (dm ? '#000000' : '#ffffff'),
                                border: `1.5px solid ${formData.mobileIconSize === opt.value ? '#6366f1' : (dm ? '#222222' : '#e5e7eb')}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '6px',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: opt.px }}>🛒</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: formData.mobileIconSize === opt.value ? '#6366f1' : (dm ? '#e0e0e0' : '#111111') }}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Show labels */}
                      {toggleRow('mobileShowLabels', 'Show Tab Labels', 'Show text labels below icons in the nav bar')}

                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* PHONE — VISIBLE TABS                          */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#0a0a0a', marginBottom: '4px' }}>
                      🗂 Bottom Bar Tabs
                    </div>
                    <div style={{ fontSize: '13px', color: dm ? '#6b7280' : '#9ca3af', marginBottom: '14px' }}>
                      Pick up to 5 tabs — unselected ones go in the "More" drawer.
                    </div>

                    {/* Visual preview strip */}
                    <div style={{
                      background: dm ? '#0f0f1e' : '#f3f4f6',
                      borderRadius: '12px',
                      padding: '10px 8px',
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '14px',
                      overflowX: 'auto',
                    }}>
                      {currentTabs.map(tabId => {
                        const t = ALL_TAB_OPTIONS.find(x => x.id === tabId) ?? { id: tabId, label: 'More', icon: '⋯' };
                        return (
                          <div key={t.id} style={{
                            flex: 1, minWidth: '48px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                            padding: '8px 4px',
                            background: 'rgba(99,102,241,0.15)',
                            borderRadius: '10px',
                          }}>
                            <span style={{ fontSize: '18px' }}>{t.icon}</span>
                            <span style={{ fontSize: '9px', color: '#6366f1', fontWeight: '700' }}>{t.label.slice(0, 6)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ALL_TAB_OPTIONS.map(tab => {
                        const isSelected = currentTabs.includes(tab.id);
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              const newTabs = isSelected
                                ? currentTabs.filter(t => t !== tab.id)
                                : currentTabs.length < 5
                                  ? [...currentTabs.filter(t => t !== 'more'), tab.id, 'more'].slice(0, 5)
                                  : currentTabs;
                              handleInputChange('mobileNavTabs', newTabs);
                              if (currentTabs.length >= 5 && !isSelected) {
                                setAlertMessage('Maximum 5 tabs. Remove one first.');
                                setAlertType('error');
                                setShowAlert(true);
                                setTimeout(() => setShowAlert(false), 2500);
                              }
                            }}
                            style={{
                              padding: '9px 13px',
                              background: isSelected
                                ? '#6366f1'
                                : (dm ? '#000000' : '#f3f4f6'),
                              color: isSelected ? '#ffffff' : (dm ? '#9ca3af' : '#6b7280'),
                              border: `1px solid ${isSelected ? '#6366f1' : (dm ? '#222222' : '#e5e7eb')}`,
                              borderRadius: '10px',
                              fontSize: '13px', fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.15s',
                              opacity: !isSelected && currentTabs.length >= 5 ? 0.45 : 1,
                            }}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {isSelected && <span style={{ fontSize: '10px', opacity: 0.7 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ ...hint, marginTop: '10px' }}>
                      {currentTabs.filter(t => t !== 'more').length}/5 tabs selected
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* TABLET — LAYOUT & SIDEBAR                      */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#0a0a0a', marginBottom: '16px' }}>
                      🖥️ Tablet Layout
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      <div>
                        <label style={label}>Layout Mode</label>
                        <div style={{
                          padding: '14px 16px',
                          background: dm ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
                          border: '1.5px solid #6366f1',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '20px' }}>🔝</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
                              Top Bar (Fixed)
                            </div>
                            <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af' }}>
                              Tablets now use the same horizontal navigation as laptops for consistency.
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })()}

            {activeSection === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🏪 Business Registration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Business Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.businessRegistrationNumber || ''}
                        onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Business License Number
                      </label>
                      <input
                        type="text"
                        value={formData.businessLicenseNumber || ''}
                        onChange={(e) => handleInputChange('businessLicenseNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        FSSAI Number
                      </label>
                      <input
                        type="text"
                        value={formData.fssaiNumber || ''}
                        onChange={(e) => handleInputChange('fssaiNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Founded Date
                      </label>
                      <input
                        type="date"
                        value={formData.foundedDate || ''}
                        onChange={(e) => handleInputChange('foundedDate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📱 Social Media
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.socialMediaInstagram || ''}
                        onChange={(e) => handleInputChange('socialMediaInstagram', e.target.value)}
                        placeholder="@yourbusiness"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={formData.socialMediaFacebook || ''}
                        onChange={(e) => handleInputChange('socialMediaFacebook', e.target.value)}
                        placeholder="facebook.com/yourbusiness"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Twitter/X
                      </label>
                      <input
                        type="text"
                        value={formData.socialMediaTwitter || ''}
                        onChange={(e) => handleInputChange('socialMediaTwitter', e.target.value)}
                        placeholder="@yourbusiness"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tax' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    💰 Advanced Tax Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Enable Compound Tax
                      </label>
                      <select
                        value={formData.enableCompoundTax ? 'yes' : 'no'}
                        onChange={(e) => handleInputChange('enableCompoundTax', e.target.value === 'yes')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Tax-Inclusive Pricing
                      </label>
                      <select
                        value={formData.taxInclusivePricing ? 'yes' : 'no'}
                        onChange={(e) => handleInputChange('taxInclusivePricing', e.target.value === 'yes')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="no">No (Tax Added)</option>
                        <option value="yes">Yes (Tax Included)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Enable Multi-Tax Rates
                      </label>
                      <select
                        value={formData.enableMultiTaxRates ? 'yes' : 'no'}
                        onChange={(e) => handleInputChange('enableMultiTaxRates', e.target.value === 'yes')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🇮🇳 GST Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        CGST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.cgstRate || 9}
                        onChange={(e) => handleInputChange('cgstRate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        SGST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.sgstRate || 9}
                        onChange={(e) => handleInputChange('sgstRate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        IGST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.igstRate || 18}
                        onChange={(e) => handleInputChange('igstRate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        CESS Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.cessRate || 0}
                        onChange={(e) => handleInputChange('cessRate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Settings */}
            {activeSection === 'tab-dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📊 Dashboard Layout
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Dashboard Layout
                      </label>
                      <select
                        value={formData.dashboardLayout || 'default'}
                        onChange={(e) => handleInputChange('dashboardLayout', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      >
                        <option value="default">Default</option>
                        <option value="compact">Compact</option>
                        <option value="detailed">Detailed</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Widget Refresh Interval (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.widgetRefreshInterval || 30}
                        onChange={(e) => handleInputChange('widgetRefreshInterval', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📈 Widgets
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'showSalesWidget', label: 'Sales Widget', desc: 'Show sales statistics' },
                      { key: 'showOrdersWidget', label: 'Orders Widget', desc: 'Show order statistics' },
                      { key: 'showInventoryWidget', label: 'Inventory Widget', desc: 'Show inventory status' },
                      { key: 'showStaffWidget', label: 'Staff Widget', desc: 'Show staff performance' },
                      { key: 'showRevenueChart', label: 'Revenue Chart', desc: 'Show revenue trends' },
                      { key: 'showOrderChart', label: 'Order Chart', desc: 'Show order trends' }
                    ].map(widget => (
                      <div key={widget.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{widget.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{widget.desc}</div>
                        </div>
                        <button
                          onClick={() => handleInputChange(widget.key, !formData[widget.key])}
                          style={{
                            width: '48px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[widget.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '3px',
                            left: formData[widget.key] ? '23px' : '3px',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reports Settings */}
            {activeSection === 'tab-reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📑 Auto Reports</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Enable Auto Reports</label>
                      <select value={formData.enableAutoReports ? 'yes' : 'no'} onChange={(e) => handleInputChange('enableAutoReports', e.target.value === 'yes')} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Report Schedule</label>
                      <select value={formData.reportSchedule || 'daily'} onChange={(e) => handleInputChange('reportSchedule', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CRM Settings */}
            {activeSection === 'tab-crm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>⭐ Loyalty Program</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Points per ₹10</label>
                      <input type="number" value={formData.loyaltyPointsPerRupee || 1} onChange={(e) => handleInputChange('loyaltyPointsPerRupee', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Settings */}
            {activeSection === 'tab-staff' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>👨‍🍳 Staff Management</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Shift Duration (hours)</label>
                      <input type="number" value={formData.defaultShiftDuration || 8} onChange={(e) => handleInputChange('defaultShiftDuration', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Settings */}
            {activeSection === 'tab-menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🍽️ Menu Display</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Menu Layout</label>
                      <select value={formData.menuLayout || 'grid'} onChange={(e) => handleInputChange('menuLayout', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Settings */}
            {activeSection === 'tab-inventory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📦 Inventory Management</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Low Stock Threshold</label>
                      <input type="number" value={formData.lowStockThreshold || 10} onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Toast Orders Settings */}
            {activeSection === 'toast-orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🍞 Toast POS Display</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'toastShowPrice', label: 'Show Price', desc: 'Display item prices in cart' },
                      { key: 'toastShowQuantity', label: 'Show Quantity', desc: 'Display item quantities' },
                      { key: 'toastShowCategory', label: 'Show Category', desc: 'Display item categories' },
                      { key: 'toastShowModals', label: 'Show Modals', desc: 'Use GUI modals instead of alerts' },
                      { key: 'toastShowTableNumber', label: 'Show Table Number', desc: 'Display table on order' },
                      { key: 'toastShowServerName', label: 'Show Server Name', desc: 'Display assigned server' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>💰 Pricing & Payments</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Payment Method</label>
                      <select value={formData.toastDefaultPaymentMethod || 'cash'} onChange={(e) => handleInputChange('toastDefaultPaymentMethod', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Delivery Fee</label>
                      <input type="number" value={formData.toastDeliveryFee || 50} onChange={(e) => handleInputChange('toastDeliveryFee', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Min Order Value</label>
                      <input type="number" value={formData.toastMinimumOrderValue || 0} onChange={(e) => handleInputChange('toastMinimumOrderValue', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Max Order Value</label>
                      <input type="number" value={formData.toastMaximumOrderValue || 100000} onChange={(e) => handleInputChange('toastMaximumOrderValue', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableDiscount', label: 'Enable Discounts', desc: 'Allow discount functionality' },
                      { key: 'toastEnableTips', label: 'Enable Tips', desc: 'Allow tip functionality' },
                      { key: 'toastEnableServiceCharge', label: 'Enable Service Charge', desc: 'Add service charge to orders' },
                      { key: 'toastEnableTaxExemption', label: 'Enable Tax Exemption', desc: 'Allow tax-exempt orders' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🪑 Table & Seat Management</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Table</label>
                      <input type="number" value={formData.toastDefaultTable || 1} onChange={(e) => handleInputChange('toastDefaultTable', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Max Seats</label>
                      <input type="number" value={formData.toastMaxSeats || 10} onChange={(e) => handleInputChange('toastMaxSeats', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Server</label>
                      <input type="text" value={formData.toastDefaultServer || ''} onChange={(e) => handleInputChange('toastDefaultServer', e.target.value)} placeholder="Server name" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastAutoAssignTable', label: 'Auto Assign Table', desc: 'Automatically assign table to order' },
                      { key: 'toastEnableSeatSplitting', label: 'Enable Seat Splitting', desc: 'Allow splitting by seats' },
                      { key: 'toastEnableServerAssignment', label: 'Enable Server Assignment', desc: 'Assign servers to orders' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>⏱️ Timing & Workflow</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Order Timer Warning (min)</label>
                      <input type="number" value={formData.toastOrderTimerWarning || 30} onChange={(e) => handleInputChange('toastOrderTimerWarning', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Kitchen Delay (min)</label>
                      <input type="number" value={formData.toastDefaultKitchenDelay || 0} onChange={(e) => handleInputChange('toastDefaultKitchenDelay', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableOrderTimer', label: 'Enable Order Timer', desc: 'Track order preparation time' },
                      { key: 'toastEnableKitchenDelay', label: 'Enable Kitchen Delay', desc: 'Allow setting kitchen delays' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🔧 Item Operations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'toastEnableItemSplitting', label: 'Enable Item Splitting', desc: 'Split items between seats' },
                      { key: 'toastEnableItemTransfer', label: 'Enable Item Transfer', desc: 'Transfer items between orders' },
                      { key: 'toastEnableVoid', label: 'Enable Void', desc: 'Allow voiding items' },
                      { key: 'toastEnableDuplication', label: 'Enable Duplication', desc: 'Duplicate items in cart' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🖨️ Printing & Hardware</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'toastEnablePrint', label: 'Enable Printing', desc: 'Enable receipt printing' },
                      { key: 'toastPrintOnPayment', label: 'Print on Payment', desc: 'Auto-print on payment completion' },
                      { key: 'toastPrintOnKOT', label: 'Print on KOT', desc: 'Auto-print KOT to kitchen' },
                      { key: 'toastEnableCashDrawer', label: 'Enable Cash Drawer', desc: 'Control cash drawer' },
                      { key: 'toastCashDrawerAutoOpen', label: 'Auto Open Cash Drawer', desc: 'Open drawer on cash payment' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📝 Notes & Loyalty</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Loyalty Points per ₹10</label>
                      <input type="number" value={formData.toastLoyaltyPointsPerRupee || 1} onChange={(e) => handleInputChange('toastLoyaltyPointsPerRupee', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableOrderNotes', label: 'Enable Order Notes', desc: 'Add notes to orders' },
                      { key: 'toastEnableCustomerNotes', label: 'Enable Customer Notes', desc: 'Add notes to customers' },
                      { key: 'toastEnableLoyalty', label: 'Enable Loyalty', desc: 'Track customer loyalty points' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🛒 Order Types</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Order Type</label>
                      <select value={formData.toastDefaultOrderType || 'dine-in'} onChange={(e) => handleInputChange('toastDefaultOrderType', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="dine-in">Dine In</option>
                        <option value="takeout">Takeout</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Delivery Fee Type</label>
                      <select value={formData.toastDeliveryFeeType || 'fixed'} onChange={(e) => handleInputChange('toastDeliveryFeeType', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                        <option value="distance">Distance-based</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableTakeout', label: 'Enable Takeout', desc: 'Allow takeout orders' },
                      { key: 'toastEnableDelivery', label: 'Enable Delivery', desc: 'Allow delivery orders' },
                      { key: 'toastOrderValidation', label: 'Order Validation', desc: 'Validate orders before submission' },
                      { key: 'toastAutoCompleteOrders', label: 'Auto Complete Orders', desc: 'Auto-complete on payment' },
                      { key: 'toastAllowOrderModification', label: 'Allow Modification', desc: 'Allow modifying active orders' },
                      { key: 'toastEnableHoldOrders', label: 'Enable Hold Orders', desc: 'Hold orders for later' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🎨 Cart & Display</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Cart Layout</label>
                      <select value={formData.toastCartLayout || 'list'} onChange={(e) => handleInputChange('toastCartLayout', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="list">List</option>
                        <option value="grid">Grid</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Cart Grouping</label>
                      <select value={formData.toastCartGrouping || 'category'} onChange={(e) => handleInputChange('toastCartGrouping', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="category">By Category</option>
                        <option value="time">By Time</option>
                        <option value="seat">By Seat</option>
                        <option value="none">No Grouping</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastShowItemImages', label: 'Show Item Images', desc: 'Display images in cart' },
                      { key: 'toastEnableItemSearch', label: 'Enable Item Search', desc: 'Search items in menu' },
                      { key: 'toastEnableFavorites', label: 'Enable Favorites', desc: 'Mark favorite items' },
                      { key: 'toastEnableRecentItems', label: 'Show Recent Items', desc: 'Show recently ordered items' },
                      { key: 'toastEnableQuantityButtons', label: 'Quantity Buttons', desc: 'Quick quantity selection buttons' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🎁 Promotions & Discounts</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Happy Hour Start</label>
                      <input type="time" value={formData.toastHappyHourStart || '15:00'} onChange={(e) => handleInputChange('toastHappyHourStart', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Happy Hour End</label>
                      <input type="time" value={formData.toastHappyHourEnd || '18:00'} onChange={(e) => handleInputChange('toastHappyHourEnd', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableHappyHour', label: 'Enable Happy Hour', desc: 'Special happy hour pricing' },
                      { key: 'toastEnablePromotions', label: 'Enable Promotions', desc: 'Run promotional campaigns' },
                      { key: 'toastPromotionAutoApply', label: 'Auto Apply Promotions', desc: 'Automatically apply eligible promotions' },
                      { key: 'toastEnableCoupons', label: 'Enable Coupons', desc: 'Accept coupon codes' },
                      { key: 'toastEnableGiftCards', label: 'Enable Gift Cards', desc: 'Accept gift card payments' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>💳 Payment & Refunds</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Max Splits</label>
                      <input type="number" value={formData.toastMaxSplits || 5} onChange={(e) => handleInputChange('toastMaxSplits', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Refund Timeout (hours)</label>
                      <input type="number" value={formData.toastRefundTimeout || 24} onChange={(e) => handleInputChange('toastRefundTimeout', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {[
                      { key: 'toastEnableSplitsPayment', label: 'Enable Split Payments', desc: 'Allow splitting payments' },
                      { key: 'toastSplitValidation', label: 'Split Validation', desc: 'Validate split payments' },
                      { key: 'toastEnableRefunds', label: 'Enable Refunds', desc: 'Process refunds' },
                      { key: 'toastRefundRequireReason', label: 'Refund Require Reason', desc: 'Require reason for refund' },
                      { key: 'toastRefundApprovalRequired', label: 'Refund Approval Required', desc: 'Manager approval for refunds' },
                      { key: 'toastEnableExchange', label: 'Enable Exchange', desc: 'Allow item exchanges' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Oracle KDS Settings */}
            {activeSection === 'oracle-kds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🔮 Oracle KDS Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Color Code</label>
                      <select value={formData.oracleKdsColorCode || 'red'} onChange={(e) => handleInputChange('oracleKdsColorCode', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Sort By</label>
                      <select value={formData.oracleKdsSortBy || 'time'} onChange={(e) => handleInputChange('oracleKdsSortBy', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="time">Time</option>
                        <option value="priority">Priority</option>
                        <option value="table">Table</option>
                        <option value="category">Category</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Station Count</label>
                      <input type="number" value={formData.oracleKdsStationCount || 5} onChange={(e) => handleInputChange('oracleKdsStationCount', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Prep Time (min)</label>
                      <input type="number" value={formData.oracleKdsDefaultPrepTime || 15} onChange={(e) => handleInputChange('oracleKdsDefaultPrepTime', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Refresh Interval (sec)</label>
                      <input type="number" value={formData.oracleKdsRefreshInterval || 30} onChange={(e) => handleInputChange('oracleKdsRefreshInterval', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Sound Type</label>
                      <select value={formData.oracleKdsSoundType || 'chime'} onChange={(e) => handleInputChange('oracleKdsSoundType', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="chime">Chime</option>
                        <option value="bell">Bell</option>
                        <option value="alert">Alert</option>
                        <option value="gentle">Gentle</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>⚡ Oracle KDS Features</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'oracleKdsAutoAssign', label: 'Auto Assign Orders', desc: 'Automatically assign orders to stations' },
                      { key: 'oracleKdsShowTimer', label: 'Show Timer', desc: 'Display preparation timers' },
                      { key: 'oracleKdsShowIngredients', label: 'Show Ingredients', desc: 'Display item ingredients' },
                      { key: 'oracleKdsPriorityEnabled', label: 'Enable Priority', desc: 'Use priority system' },
                      { key: 'oracleKdsShowPriority', label: 'Show Priority', desc: 'Display priority badges' },
                      { key: 'oracleKdsAutoRefresh', label: 'Auto Refresh', desc: 'Automatically refresh orders' },
                      { key: 'oracleKdsShowTableNumber', label: 'Show Table Number', desc: 'Display table on orders' },
                      { key: 'oracleKdsShowServerName', label: 'Show Server Name', desc: 'Display server on orders' },
                      { key: 'oracleKdsShowCustomerName', label: 'Show Customer Name', desc: 'Display customer on orders' },
                      { key: 'oracleKdsGroupByStation', label: 'Group by Station', desc: 'Group orders by station' },
                      { key: 'oracleKdsColorByTime', label: 'Color by Time', desc: 'Color orders by time elapsed' },
                      { key: 'oracleKdsShowAllergens', label: 'Show Allergens', desc: 'Display allergen warnings' },
                      { key: 'oracleKdsShowModifiers', label: 'Show Modifiers', desc: 'Display item modifiers' },
                      { key: 'oracleKdsShowNotes', label: 'Show Notes', desc: 'Display order notes' },
                      { key: 'oracleKdsAutoPrint', label: 'Auto Print', desc: 'Auto-print orders' },
                      { key: 'oracleKdsSoundAlerts', label: 'Sound Alerts', desc: 'Play sound on new orders' },
                      { key: 'oracleKdsEnableFire', label: 'Enable Fire', desc: 'Enable fire button' },
                      { key: 'oracleKdsAutoFire', label: 'Auto Fire', desc: 'Auto-fire orders after delay' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🔊 Sound Settings</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Volume ({formData.oracleKdsVolume || 70}%)</label>
                      <input type="range" min="0" max="100" value={formData.oracleKdsVolume || 70} onChange={(e) => handleInputChange('oracleKdsVolume', parseInt(e.target.value))} style={{ width: '100%', height: '8px', borderRadius: '4px', background: darkMode ? '#222222' : '#d1d5db', outline: 'none', cursor: 'pointer' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Fire Delay (min)</label>
                      <input type="number" value={formData.oracleKdsFireDelay || 5} onChange={(e) => handleInputChange('oracleKdsFireDelay', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Split KDS Settings */}
            {activeSection === 'split-kds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🔀 Split KDS Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Max Splits Per Order</label>
                      <input type="number" value={formData.splitKdsMaxSplits || 4} onChange={(e) => handleInputChange('splitKdsMaxSplits', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Min Split Quantity</label>
                      <input type="number" value={formData.splitKdsMinSplitQuantity || 2} onChange={(e) => handleInputChange('splitKdsMinSplitQuantity', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Merge Threshold</label>
                      <input type="number" value={formData.splitKdsMergeThreshold || 2} onChange={(e) => handleInputChange('splitKdsMergeThreshold', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Split Rules</label>
                      <select value={formData.splitKdsSplitRules || 'quantity'} onChange={(e) => handleInputChange('splitKdsSplitRules', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="quantity">By Quantity</option>
                        <option value="category">By Category</option>
                        <option value="station">By Station</option>
                        <option value="time">By Time</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Split Indicator Color</label>
                      <select value={formData.splitKdsSplitIndicatorColor || 'orange'} onChange={(e) => handleInputChange('splitKdsSplitIndicatorColor', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="orange">Orange</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="red">Red</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>⚡ Split KDS Features</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'splitKdsEnableSplitting', label: 'Enable Splitting', desc: 'Allow splitting orders across stations' },
                      { key: 'splitKdsAutoSplit', label: 'Auto Split', desc: 'Automatically split large orders' },
                      { key: 'splitKdsShowProgress', label: 'Show Progress', desc: 'Display split progress indicator' },
                      { key: 'splitKdsSplitByCategory', label: 'Split by Category', desc: 'Group splits by category' },
                      { key: 'splitKdsSplitByStation', label: 'Split by Station', desc: 'Group splits by station' },
                      { key: 'splitKdsAutoMerge', label: 'Auto Merge', desc: 'Automatically merge completed splits' },
                      { key: 'splitKdsShowSplitOrigin', label: 'Show Split Origin', desc: 'Display original order on splits' },
                      { key: 'splitKdsEnableManualSplit', label: 'Enable Manual Split', desc: 'Allow manual splitting' },
                      { key: 'splitKdsShowSplitIndicator', label: 'Show Split Indicator', desc: 'Visual indicator for split orders' },
                      { key: 'splitKdsEnableCrossStation', label: 'Enable Cross Station', desc: 'Allow splits across stations' },
                      { key: 'splitKdsSyncAcrossStations', label: 'Sync Across Stations', desc: 'Sync split status across stations' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chowbus KDS Settings */}
            {activeSection === 'chowbus-kds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🚌 Chowbus KDS Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Bus Count</label>
                      <input type="number" value={formData.chowbusKdsBusCount || 5} onChange={(e) => handleInputChange('chowbusKdsBusCount', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Max Orders Per Bus</label>
                      <input type="number" value={formData.chowbusKdsMaxOrdersPerBus || 20} onChange={(e) => handleInputChange('chowbusKdsMaxOrdersPerBus', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Bus Capacity</label>
                      <input type="number" value={formData.chowbusKdsBusCapacity || 50} onChange={(e) => handleInputChange('chowbusKdsBusCapacity', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default ETA (min)</label>
                      <input type="number" value={formData.chowbusKdsDefaultETA || 30} onChange={(e) => handleInputChange('chowbusKdsDefaultETA', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Delay Threshold (min)</label>
                      <input type="number" value={formData.chowbusKdsDelayThreshold || 15} onChange={(e) => handleInputChange('chowbusKdsDelayThreshold', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Route Optimization</label>
                      <select value={formData.chowbusKdsRouteOptimization || 'nearest'} onChange={(e) => handleInputChange('chowbusKdsRouteOptimization', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}>
                        <option value="nearest">Nearest</option>
                        <option value="fastest">Fastest</option>
                        <option value="shortest">Shortest</option>
                        <option value="balanced">Balanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🚌 Bus Management</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'chowbusKdsEnableBusManagement', label: 'Enable Bus Management', desc: 'Manage delivery buses' },
                      { key: 'chowbusKdsAutoAssign', label: 'Auto Assign Orders', desc: 'Automatically assign to buses' },
                      { key: 'chowbusKdsAutoOptimize', label: 'Auto Optimize Routes', desc: 'Automatically optimize bus routes' },
                      { key: 'chowbusKdsAutoReassign', label: 'Auto Reassign', desc: 'Reassign orders on delays' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📍 Tracking & Display</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'chowbusKdsShowRoute', label: 'Show Route', desc: 'Display delivery route on map' },
                      { key: 'chowbusKdsShowBusStatus', label: 'Show Bus Status', desc: 'Display bus status indicators' },
                      { key: 'chowbusKdsShowETA', label: 'Show ETA', desc: 'Display estimated arrival time' },
                      { key: 'chowbusKdsTrackDriver', label: 'Track Driver', desc: 'Track driver location' },
                      { key: 'chowbusKdsShowDriverLocation', label: 'Show Driver Location', desc: 'Display driver on map' },
                      { key: 'chowbusKdsShowDeliveryMap', label: 'Show Delivery Map', desc: 'Display delivery route map' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📝 Communication</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'chowbusKdsEnableDriverNotes', label: 'Enable Driver Notes', desc: 'Allow driver to add notes' },
                      { key: 'chowbusKdsNotifyOnDelay', label: 'Notify on Delay', desc: 'Send notifications on delays' }
                    ].map(feature => (
                      <div key={feature.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{feature.label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{feature.desc}</div>
                        </div>
                        <button onClick={() => handleInputChange(feature.key, !formData[feature.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', background: formData[feature.key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData[feature.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kitchen Settings */}
            {activeSection === 'tab-kitchen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>👨‍🍳 Kitchen Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>Default Prep Time (minutes)</label>
                      <input type="number" value={formData.defaultPrepTime || 15} onChange={(e) => handleInputChange('defaultPrepTime', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'pos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* POS Mode */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🛒 POS Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        POS Mode
                      </label>
                      <select
                        value={formData.posMode}
                        onChange={(e) => handleInputChange('posMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="basic">Basic</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Order Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.orderTimeout}
                        onChange={(e) => handleInputChange('orderTimeout', e.target.value)}
                        placeholder="30"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '8px' }}>
                        Auto-cancel orders after inactivity (0 = disabled)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Display & Management */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📋 Order Display & Management
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'showTokensOnOrders', label: 'Show token numbers on orders', desc: 'Display token ID in order list' },
                      { key: 'groupByTable', label: 'Group orders by table', desc: 'Organize orders by table number' },
                      { key: 'showOrderTime', label: 'Show order creation time', desc: 'Display when order was placed' },
                      { key: 'showCustomerName', label: 'Show customer name', desc: 'Display customer on order cards' },
                      { key: 'autoRefreshOrders', label: 'Auto-refresh order list', desc: 'Automatically update orders' },
                      { key: 'allowOrderEdit', label: 'Allow order editing', desc: 'Edit orders after creation' },
                      { key: 'allowOrderSplit', label: 'Allow order splitting', desc: 'Split orders across payments' },
                      { key: 'showOrderTotal', label: 'Show order total', desc: 'Display total on order cards' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{desc}</div>
                        </div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Refresh Interval (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.orderRefreshInterval || 30}
                        onChange={(e) => handleInputChange('orderRefreshInterval', parseInt(e.target.value) || 30)}
                        placeholder="30"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Order Requirements */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📋 Order Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'requireCustomer', label: 'Require customer selection for orders' },
                      { key: 'requireTable', label: 'Require table selection for orders' },
                      { key: 'allowWalkIn', label: 'Allow walk-in orders (no customer/table)' },
                      { key: 'requirePaymentBeforeKOT', label: 'Require payment before sending to kitchen' },
                      { key: 'autoCreateKOT', label: 'Auto-create KOT on order completion' },
                      { key: 'autoAssignTables', label: 'Auto-assign available tables' },
                      { key: 'requireStaffForOrder', label: 'Require staff assignment for orders' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Card Column Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    📊 Order Card Columns
                  </div>
                  <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '16px' }}>
                    Configure which columns to display on order cards in Order History
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                      { key: 'orderCardColumn_table', label: 'Table Number' },
                      { key: 'orderCardColumn_time', label: 'Time & Age' },
                      { key: 'orderCardColumn_customer', label: 'Customer Info' },
                      { key: 'orderCardColumn_categories', label: 'Category Breakdown' },
                      { key: 'orderCardColumn_items', label: 'Item Count' },
                      { key: 'orderCardColumn_total', label: 'Total Amount' },
                      { key: 'orderCardColumn_status', label: 'Order Status' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '48px',
                            height: '26px',
                            borderRadius: '13px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: formData[key] ? '25px' : '3px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px', background: darkMode ? '#0a0a0a' : '#f0f9ff', borderRadius: '8px', fontSize: '12px', color: darkMode ? '#9ca3af' : '#0c4a6e' }}>
                    💡 Tip: Click the "🔧 Columns" button in Order History to reorder columns or reset to defaults
                  </div>
                </div>

                {/* Payment Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    💳 Payment Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={formData.razorpayKeyId}
                        onChange={(e) => handleInputChange('razorpayKeyId', e.target.value)}
                        placeholder="rzp_test_..."
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '8px' }}>
                        Your Razorpay key ID for card, UPI, and wallet payments
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        UPI ID (for QR payments)
                      </label>
                      <input
                        type="text"
                        value={formData.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                        placeholder="yourupi@paytm"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { key: 'enableSplitPayment', label: 'Enable split payments', desc: 'Allow customers to split payment across methods' },
                        { key: 'enablePartialPayment', label: 'Enable partial payments', desc: 'Allow paying part of order total' },
                        { key: 'requireFullPayment', label: 'Require full payment', desc: 'Complete payment before order completion' },
                        { key: 'showPaymentHistory', label: 'Show payment history', desc: 'Display past payment methods on orders' },
                        { key: 'enableTip', label: 'Enable tipping', desc: 'Allow customers to add tips' }
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                            <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '4px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{
                              width: '52px',
                              height: '28px',
                              borderRadius: '14px',
                              background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              left: formData[key] ? '28px' : '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              transition: 'left 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discount & Pricing Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🏷️ Discount & Pricing
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'enableDiscount', label: 'Enable discounts on orders' },
                      { key: 'enableCustomOrders', label: 'Enable custom orders (items not in menu)' },
                      { key: 'enableVoid', label: 'Enable void orders' },
                      { key: 'enableOrderNotes', label: 'Enable order notes' },
                      { key: 'enableHoldOrders', label: 'Enable hold orders feature' },
                      { key: 'allowPriceOverride', label: 'Allow price override', desc: 'Staff can change item prices' },
                      { key: 'enableCoupons', label: 'Enable coupon codes', desc: 'Accept discount coupons' },
                      { key: 'maxDiscountPercent', label: 'Max discount %', desc: 'Maximum discount allowed', type: 'number' }
                    ].map(({ key, label, desc, type }) => (
                      type === 'number' ? (
                        <div key={key}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                            {label}
                          </label>
                          <input
                            type="number"
                            value={formData[key] || 0}
                            onChange={(e) => handleInputChange(key, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                              borderRadius: '12px',
                              fontSize: '15px',
                              background: darkMode ? '#000000' : '#ffffff',
                              color: darkMode ? '#ffffff' : '#0a0a0a',
                              outline: 'none'
                            }}
                          />
                          <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '8px' }}>{desc}</div>
                        </div>
                      ) : (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                            {desc && <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{desc}</div>}
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{
                              width: '52px',
                              height: '28px',
                              borderRadius: '14px',
                              background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              left: formData[key] ? '28px' : '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              transition: 'left 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Receipt & Printing */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🧾 Receipt & Printing
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'autoPrintReceipt', label: 'Auto-print receipts', desc: 'Print receipt on payment' },
                      { key: 'printKOTOnOrder', label: 'Print KOT on order', desc: 'Send to kitchen printer' },
                      { key: 'showLogoOnReceipt', label: 'Show logo on receipt', desc: 'Print store logo' },
                      { key: 'showGstOnReceipt', label: 'Show GST on receipt', desc: 'Display tax breakdown' },
                      { key: 'showTableOnReceipt', label: 'Show table on receipt', desc: 'Print table number' },
                      { key: 'showCustomerOnReceipt', label: 'Show customer on receipt', desc: 'Print customer name' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{desc}</div>
                        </div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Custom Order Accordion Settings ───────────────────── */}
            {activeSection === 'pos' && formData.enableCustomOrders && (() => {
              const dm = darkMode;
              const cardStyle = {
                padding: '20px',
                background: screenSize === 'small' ? 'transparent' : (dm ? '#111111' : '#f9fafb'),
                borderRadius: '16px',
                border: screenSize === 'small' ? 'none' : `1px solid ${dm ? '#222222' : '#e5e7eb'}`,
              };
              const labelStyle = {
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: dm ? '#e0e0e0' : '#111111', marginBottom: '8px',
              };
              const inputStyle = {
                padding: '10px 12px',
                border: `1px solid ${dm ? '#222222' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: screenSize === 'small' ? '16px' : '14px',
                background: dm ? '#000000' : '#ffffff',
                color: dm ? '#ffffff' : '#0a0a0a',
                outline: 'none',
                width: '100%',
              };
              const ToggleRow = ({ field, title, desc }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: dm ? '#000000' : '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${dm ? '#222222' : '#e5e7eb'}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: dm ? '#f9fafb' : '#0a0a0a' }}>{title}</div>
                    {desc && <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>{desc}</div>}
                  </div>
                  <div
                    onClick={() => handleInputChange(field, !formData[field])}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
                      background: formData[field] ? '#6366f1' : (dm ? '#111111' : '#d1d5db'),
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: formData[field] ? '25px' : '3px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#ffffff', transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }} />
                  </div>
                </div>
              );

              const presets = formData.customOrderPresets || [];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={cardStyle}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#0a0a0a', marginBottom: '16px' }}>
                      ✚ Custom Order — Inline Panel
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      {/* Visibility toggles */}
                      <ToggleRow field="customOrderShowCategory" title="Show category field"
                        desc="Let staff assign a category to the custom item" />
                      <ToggleRow field="customOrderShowNotes" title="Show notes field"
                        desc="Let staff add a note or instruction to the custom item" />

                      {/* Default category */}
                      <div>
                        <label style={labelStyle}>Default Category</label>
                        <select
                          value={formData.customOrderDefaultCategory}
                          onChange={e => handleInputChange('customOrderDefaultCategory', e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {['Food', 'Beverages', 'Extras', 'Services', 'Custom'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '6px' }}>
                          Pre-selected when a custom item is added
                        </div>
                      </div>

                      {/* Presets editor */}
                      <div>
                        <label style={labelStyle}>Quick-Add Presets</label>
                        <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginBottom: '10px' }}>
                          These chips appear at the top of the inline panel for one-tap entry.
                        </div>

                        {/* Preset rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                          {presets.map((preset, idx) => (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '10px 12px',
                              background: dm ? '#000000' : '#ffffff',
                              borderRadius: '10px',
                              border: `1px solid ${dm ? '#222222' : '#e5e7eb'}`,
                            }}>
                              {/* Icon */}
                              <input
                                type="text"
                                value={preset.icon}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], icon: e.target.value };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                style={{
                                  width: '44px', textAlign: 'center', padding: '6px 4px',
                                  background: dm ? '#111111' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#111111' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '18px', outline: 'none',
                                  color: dm ? '#ffffff' : '#0a0a0a',
                                }}
                              />
                              {/* Name */}
                              <input
                                type="text"
                                value={preset.name}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                placeholder="Name"
                                style={{
                                  flex: 1, padding: '6px 10px',
                                  background: dm ? '#111111' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#111111' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '13px', outline: 'none',
                                  color: dm ? '#ffffff' : '#0a0a0a',
                                }}
                              />
                              {/* Price */}
                              <input
                                type="number"
                                value={preset.price}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                placeholder="₹"
                                style={{
                                  width: '68px', padding: '6px 8px', textAlign: 'right',
                                  background: dm ? '#111111' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#111111' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '13px', outline: 'none',
                                  color: dm ? '#ffffff' : '#0a0a0a',
                                }}
                              />
                              {/* Remove */}
                              <button
                                onClick={() => handleInputChange('customOrderPresets', presets.filter((_, i) => i !== idx))}
                                style={{
                                  background: 'transparent',
                                  border: `1px solid ${dm ? '#111111' : '#e5e7eb'}`,
                                  borderRadius: '8px', padding: '6px 8px',
                                  cursor: 'pointer', fontSize: '13px',
                                  color: dm ? '#6b7280' : '#9ca3af',
                                }}
                              >🗑</button>
                            </div>
                          ))}
                        </div>

                        {/* Add preset */}
                        <button
                          onClick={() => handleInputChange('customOrderPresets', [...presets, { name: '', price: 0, icon: '⭐' }])}
                          style={{
                            width: '100%', padding: '11px',
                            background: 'transparent',
                            border: `1.5px dashed ${dm ? '#111111' : '#d1d5db'}`,
                            borderRadius: '10px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600',
                            color: dm ? '#6b7280' : '#9ca3af',
                            transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = dm ? '#111111' : '#d1d5db'}
                        >
                          + Add Preset
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {activeSection === 'itemcodes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔢 Item Code Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Code Type
                      </label>
                      <select
                        value={formData.codeType}
                        onChange={(e) => handleInputChange('codeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="alphanumeric">Alphanumeric (A1, B2...)</option>
                        <option value="numeric">Numeric (101, 102...)</option>
                        <option value="alphabetic">Alphabetic (AA, AB...)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'kitchen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    👨‍🍳 Kitchen Display
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>Enable Kitchen Display</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '4px' }}>Show kitchen orders on dedicated display</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('kitchenDisplayEnabled', !formData.kitchenDisplayEnabled)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.kitchenDisplayEnabled ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.kitchenDisplayEnabled ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>Auto-Print KOT</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '4px' }}>Automatically print Kitchen Order Tickets when orders are placed</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('autoPrintKOT', !formData.autoPrintKOT)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.autoPrintKOT ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.autoPrintKOT ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'qr' && (
              <div style={{ display: 'flex', flexDirection: screenSize === 'small' ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Form Controls */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Status Banner */}
                  <div style={{
                    padding: '16px 20px',
                    background: formData.qrOrderingEnabled
                      ? 'linear-gradient(135deg, #10b98122, #05966933)'
                      : 'linear-gradient(135deg, #ef444422, #dc262633)',
                    borderRadius: '12px',
                    border: `1px solid ${formData.qrOrderingEnabled ? '#10b98188' : '#ef444488'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: formData.qrOrderingEnabled ? '#10b981' : '#ef4444' }}>
                        {formData.qrOrderingEnabled ? '✅ QR Ordering is ENABLED' : '🚫 QR Ordering is DISABLED'}
                      </div>
                      <div style={{ fontSize: '12px', color: t.textMute, marginTop: '3px' }}>
                        {formData.qrOrderingEnabled
                          ? 'Customers can scan table QR codes to place orders'
                          : 'The QR ordering page will show a disabled notice'}
                      </div>
                    </div>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        onClick={() => handleInputChange('qrOrderingEnabled', !formData.qrOrderingEnabled)}
                        style={{
                          width: '48px', height: '26px',
                          background: formData.qrOrderingEnabled ? '#10b981' : '#000000',
                          borderRadius: '13px', position: 'relative', cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: formData.qrOrderingEnabled ? '25px' : '3px',
                          width: '20px', height: '20px',
                          background: t.bgInput, borderRadius: '50%',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Quick Preview Link */}
                  <div style={{ padding: '14px 18px', background: t.bgEle, borderRadius: '10px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>🔗 Ordering Page URL</div>
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '3px', fontFamily: 'monospace' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/qr-ordering.html?table=...</div>
                    </div>
                    <button
                      onClick={() => window.open('/qr-ordering.html?table=' + encodeURIComponent(JSON.stringify({ tableId: 1, tableName: 'T1' })), '_blank')}
                      style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Open Live App 📱
                    </button>
                  </div>

                  {/* Branding & Content */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🏪 Branding</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Restaurant Name</label>
                        <input
                          value={formData.qrRestaurantName}
                          onChange={e => handleInputChange('qrRestaurantName', e.target.value)}
                          placeholder={formData.storeName || 'Your Restaurant'}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>GST Rate (%)</label>
                        <select
                          value={formData.qrGstRate}
                          onChange={e => handleInputChange('qrGstRate', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% GST</option>
                          <option value={12}>12% GST</option>
                          <option value={18}>18% GST</option>
                          <option value={28}>28% GST</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Welcome Message</label>
                      <textarea
                        value={formData.qrWelcomeMessage}
                        onChange={e => handleInputChange('qrWelcomeMessage', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Header Theme Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={formData.qrPrimaryColor} onChange={e => handleInputChange('qrPrimaryColor', e.target.value)} style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '12px', color: t.textMute, fontFamily: 'monospace' }}>{formData.qrPrimaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Accent Button Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={formData.qrAccentColor} onChange={e => handleInputChange('qrAccentColor', e.target.value)} style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '12px', color: t.textMute, fontFamily: 'monospace' }}>{formData.qrAccentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>⚙️ Feature Toggles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { key: 'qrSplitGst', label: 'Show CGST + SGST split', desc: 'Breaks tax down into central + state components' },
                        { key: 'qrAllowSpecialRequests', label: 'Special Requests field', desc: 'Add a customized notes textbox inside checkout' },
                        { key: 'qrAutoAcceptOrders', label: 'Auto-accept orders', desc: 'Skip server confirmation checks' },
                        { key: 'qrShowItemDescriptions', label: 'Show item descriptions', desc: 'Display descriptive text under food cards' },
                        { key: 'qrShowCategoryFilter', label: 'Category filter bar', desc: 'Show horizontal category navigation tags' },
                        { key: 'qrShowSearch', label: 'Search bar', desc: 'Let customers search specific bakery items' },
                        { key: 'qrAllowCallWaiter', label: 'Call Waiter button', desc: 'Place a digital request button inside table header' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{
                              width: '40px', height: '22px', flexShrink: 0,
                              background: formData[key] ? '#10b981' : '#000000',
                              borderRadius: '11px', position: 'relative', cursor: 'pointer',
                              transition: 'background 0.2s', marginLeft: '12px'
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: '3px',
                              left: formData[key] ? '21px' : '3px',
                              width: '16px', height: '16px',
                              background: t.bgInput, borderRadius: '50%',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>💳 Payment Methods</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { key: 'qrEnablePaymentCash', label: 'Cash at Counter', desc: 'Pay when collecting order' },
                        { key: 'qrEnablePaymentUPI', label: 'UPI Payment', desc: 'GPay, PhonePe, Paytm' },
                        { key: 'qrEnablePaymentCard', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipping Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>💰 Tipping Options</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable Tipping</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Allow customers to add tips at checkout</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableTipping', !formData.qrEnableTipping)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableTipping ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableTipping ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Default Tip %</label>
                        <input
                          type="number"
                          value={formData.qrDefaultTipPercent}
                          onChange={e => handleInputChange('qrDefaultTipPercent', Number(e.target.value))}
                          min="0"
                          max="30"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Tip Options (%)</label>
                        <input
                          type="text"
                          value={formData.qrTipOptions?.join(', ') || '0, 5, 10, 15'}
                          onChange={e => handleInputChange('qrTipOptions', e.target.value.split(',').map(n => Number(n.trim())))}
                          placeholder="0, 5, 10, 15"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customization Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🎨 Item Customization</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {[
                        { key: 'qrEnableSizeOptions', label: 'Size Options', desc: 'Regular/Large sizes with price diff' },
                        { key: 'qrEnableSpiceOptions', label: 'Spice Level', desc: 'Mild/Medium/Hot spice options' },
                        { key: 'qrEnableAddons', label: 'Add-ons', desc: 'Extra cheese, sauce, etc.' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Large Size +₹</label>
                        <input
                          type="number"
                          value={formData.qrSizeLargePrice}
                          onChange={e => handleInputChange('qrSizeLargePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Cheese +₹</label>
                        <input
                          type="number"
                          value={formData.qrAddonCheesePrice}
                          onChange={e => handleInputChange('qrAddonCheesePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Sauce +₹</label>
                        <input
                          type="number"
                          value={formData.qrAddonSaucePrice}
                          onChange={e => handleInputChange('qrAddonSaucePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Management Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>📋 Order Management</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { key: 'qrEnableOrderCancel', label: 'Allow Order Cancellation', desc: 'Customers can cancel pending orders' },
                        { key: 'qrEnableDarkMode', label: 'Dark Mode Toggle', desc: 'Enable dark/light theme switch' },
                        { key: 'qrEnableCombos', label: 'Combo/Meal Deals', desc: 'Show combo badge on bundled items' },
                        { key: 'qrEnableSplitBilling', label: 'Split Billing', desc: 'Show table orders summary for multi-orderer' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session & Business Hours Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>⏰ Session & Business Hours</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable Business Hours</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Prevent orders outside operating hours</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableBusinessHours', !formData.qrEnableBusinessHours)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableBusinessHours ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableBusinessHours ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Opening Time</label>
                        <input
                          type="time"
                          value={formData.qrBusinessHoursStart}
                          onChange={e => handleInputChange('qrBusinessHoursStart', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Closing Time</label>
                        <input
                          type="time"
                          value={formData.qrBusinessHoursEnd}
                          onChange={e => handleInputChange('qrBusinessHoursEnd', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Closed Message</label>
                      <textarea
                        value={formData.qrClosedMessage}
                        onChange={e => handleInputChange('qrClosedMessage', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'none', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={formData.qrSessionTimeout}
                        onChange={e => handleInputChange('qrSessionTimeout', Number(e.target.value))}
                        min="5"
                        max="120"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px' }}>Cart expires after inactivity</div>
                    </div>
                  </div>

                  {/* GST & Invoice Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🧾 GST & Invoice Settings</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Sequential Invoice Numbers</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Generate gap-free invoice numbers for GST compliance</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableSequentialInvoices', !formData.qrEnableSequentialInvoices)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableSequentialInvoices ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableSequentialInvoices ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Invoice Prefix</label>
                        <input
                          type="text"
                          value={formData.qrInvoicePrefix}
                          onChange={e => handleInputChange('qrInvoicePrefix', e.target.value)}
                          placeholder="INV"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Start Number</label>
                        <input
                          type="number"
                          value={formData.qrInvoiceStartNumber}
                          onChange={e => handleInputChange('qrInvoiceStartNumber', Number(e.target.value))}
                          min="1"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>GST Rounding Mode</label>
                      <select
                        value={formData.qrGstRoundingMode}
                        onChange={e => handleInputChange('qrGstRoundingMode', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                      >
                        <option value="standard">Standard (Banker's rounding)</option>
                        <option value="up">Always Round Up</option>
                        <option value="down">Always Round Down</option>
                        <option value="nearest">Nearest Paisa</option>
                      </select>
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px' }}>How to round tax amounts for GST compliance</div>
                    </div>

                    <div style={{ padding: '10px 12px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: '12px', color: t.textSub, marginBottom: '4px' }}>Last Invoice Number</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>{formData.qrInvoicePrefix}{formData.qrLastInvoiceNumber}</div>
                    </div>
                  </div>

                  {/* Thermal Printer Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🖨️ Thermal Printer</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable ESC/POS Printing</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Direct thermal printer integration</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableThermalPrinter', !formData.qrEnableThermalPrinter)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableThermalPrinter ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableThermalPrinter ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Printer Port</label>
                        <input
                          type="number"
                          value={formData.qrPrinterPort}
                          onChange={e => handleInputChange('qrPrinterPort', e.target.value)}
                          placeholder="9100"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Paper Width (mm)</label>
                        <select
                          value={formData.qrPrinterPaperWidth}
                          onChange={e => handleInputChange('qrPrinterPaperWidth', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        >
                          <option value="58">58mm</option>
                          <option value="80">80mm</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🧾 Receipt Options</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Show receipt after order</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Display thermal receipt preview on success screen</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrShowReceiptOnOrder', !formData.qrShowReceiptOnOrder)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrShowReceiptOnOrder ? '#10b981' : '#000000', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrShowReceiptOnOrder ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {[
                        { key: 'qrReceiptShowFssai',    label: 'Show FSSAI details',   desc: 'Print official FSSAI licensing number' },
                        { key: 'qrReceiptShowTariff',   label: 'Show Tariff / HSN',   desc: 'Print item taxation codes' },
                        { key: 'qrReceiptShowReviewQr', label: 'Google Review QR Code',    desc: 'Generate review links' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '10px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '36px', height: '20px', flexShrink: 0, background: formData[key] ? '#10b981' : '#000000', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '10px' }}
                          >
                            <div style={{ position: 'absolute', top: '2px', left: formData[key] ? '18px' : '2px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Receipt Footer message</label>
                      <textarea
                        value={formData.qrReceiptFooter}
                        onChange={e => handleInputChange('qrReceiptFooter', e.target.value)}
                        placeholder={formData.receiptFooter || 'Thank you for your order!'}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'none', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Smart Phone Mockup */}
                {!screenSize.includes('small') && (
                  <div style={{
                    width: '320px',
                    position: 'sticky',
                    top: '24px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: t.textMute, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📱 Live Customer App Preview
                    </div>
                    
                    {/* CSS Smartphone chassis */}
                    <div style={{
                      width: '300px',
                      height: '580px',
                      background: '#000000',
                      borderRadius: '36px',
                      border: '12px solid #000000',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 3px #222222',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}>
                      
                      {/* Notch / Dynamic Island */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90px',
                        height: '18px',
                        background: '#000000',
                        borderRadius: '10px',
                        zIndex: 99
                      }} />

                      {/* Phone Screen Container */}
                      <div style={{
                        flex: 1,
                        background: '#121214',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        color: t.text,
                        overflow: 'hidden'
                      }}>
                        
                        {/* Mock App Header */}
                        <div style={{
                          background: formData.qrPrimaryColor || '#0a0a0a',
                          padding: '24px 12px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>
                            {formData.qrRestaurantName || 'BakeryPOS Café'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                            Table 05
                          </div>
                          {formData.qrAllowCallWaiter && (
                            <button style={{
                              position: 'absolute',
                              right: '8px',
                              top: '24px',
                              background: '#ef4444',
                              color: t.text,
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '8px',
                              padding: '2px 4px',
                              fontWeight: '600'
                            }}>
                              🔔 Waiter
                            </button>
                          )}
                        </div>

                        {/* Welcome Banner */}
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '10px', color: '#cbd5e1', margin: 0 }}>
                            {formData.qrWelcomeMessage || 'Welcome! Scan to order.'}
                          </p>
                        </div>

                        {/* Category filter bar */}
                        {formData.qrShowCategoryFilter && (
                          <div style={{ display: 'flex', gap: '6px', padding: '8px 10px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['All', 'Beverages', 'Pastries', 'Dessert'].map((cat, idx) => (
                              <span key={idx} style={{
                                fontSize: '9px',
                                padding: '3px 8px',
                                background: idx === 0 ? (formData.qrAccentColor || '#10b981') : 'rgba(255,255,255,0.05)',
                                color: idx === 0 ? '#ffffff' : '#94a3b8',
                                borderRadius: '10px',
                                whiteSpace: 'nowrap'
                              }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Search Bar */}
                        {formData.qrShowSearch && (
                          <div style={{ padding: '8px 10px' }}>
                            <div style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '9px',
                              color: '#94a3b8'
                            }}>
                              🔍 Search menu...
                            </div>
                          </div>
                        )}

                        {/* Menu Item list mock */}
                        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { name: 'Signature Chocolate Croissant', price: 180, desc: 'Fresh butter croissant baked with premium dark chocolate rods.', icon: '🥐' },
                            { name: 'Blueberry Danish Roll', price: 220, desc: 'Sweet danish topped with wild blueberries & cream cheese.', icon: '🫐' }
                          ].map((item, idx) => (
                            <div key={idx} style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              padding: '8px',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '20px' }}>{item.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', fontWeight: '700' }}>{item.name}</div>
                                {formData.qrShowItemDescriptions && (
                                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.2' }}>{item.desc}</div>
                                )}
                                <div style={{ fontSize: '9px', fontWeight: '700', marginTop: '4px', color: formData.qrAccentColor || '#10b981' }}>
                                  ₹{item.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mock Checkout button */}
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <button style={{
                            width: '100%',
                            padding: '10px',
                            background: formData.qrAccentColor || '#10b981',
                            color: t.text,
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}>
                            🛒 View Basket (₹0)
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeSection === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Global Toggle */}
                <div style={{
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
                  borderRadius: '16px',
                  border: `1px solid ${t.border}`,
                  padding: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, marginBottom: '6px' }}>
                      🌗 Global Theme
                    </div>
                    <div style={{ fontSize: '13px', color: t.textMute, lineHeight: '1.5' }}>
                      Set all tabs to dark or light mode at once. You can override individual tabs below.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        const allDark = {};
                        Object.keys(formData.tabDarkModes).forEach(t => { allDark[t] = true; });
                        handleInputChange('tabDarkModes', allDark);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: Object.values(formData.tabDarkModes).every(Boolean) ? '#6366f1' : '#000000',
                        color: t.text,
                        border: `1px solid ${Object.values(formData.tabDarkModes).every(Boolean) ? '#6366f1' : '#222222'}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🌙 All Dark
                    </button>
                    <button
                      onClick={() => {
                        const allLight = {};
                        Object.keys(formData.tabDarkModes).forEach(t => { allLight[t] = false; });
                        handleInputChange('tabDarkModes', allLight);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: Object.values(formData.tabDarkModes).every(v => !v) ? '#f59e0b' : '#000000',
                        color: t.text,
                        border: `1px solid ${Object.values(formData.tabDarkModes).every(v => !v) ? '#f59e0b' : '#222222'}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ☀️ All Light
                    </button>
                  </div>
                </div>

                {/* Per-Tab Toggle Switches */}
                <div style={{
                  background: t.bgEle,
                  borderRadius: '16px',
                  border: `1px solid ${t.border}`,
                  padding: '24px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '6px' }}>
                    🎛️ Per-Tab Theme Control
                  </div>
                  <div style={{ fontSize: '12px', color: t.textMute, marginBottom: '20px' }}>
                    Toggle each tab individually — Kitchen is always dark.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {(() => {
                      const tabMeta = {
                        orders:    { icon: '🛒', label: 'Orders (POS)' },
                        dashboard: { icon: '📊', label: 'Dashboard' },
                        reports:   { icon: '📈', label: 'Reports' },
                        crm:       { icon: '👥', label: 'Customers (CRM)' },
                        staff:     { icon: '🧑‍💼', label: 'Staff' },
                        menu:      { icon: '🍽️', label: 'Menu' },
                        inventory: { icon: '📦', label: 'Inventory' },
                        recipes:   { icon: '📖', label: 'Recipes' },
                        waste:     { icon: '♻️', label: 'Waste' },
                        reservations: { icon: '📅', label: 'Reservations' },
                        tokens:    { icon: '🎫', label: 'Tokens' },
                        tables:    { icon: '🪑', label: 'Tables' },
                        waiters:   { icon: '🤵', label: 'Waiters' },
                        settings:  { icon: '⚙️', label: 'Settings' },
                      };
                      return Object.keys(formData.tabDarkModes).map(tab => {
                        const meta = tabMeta[tab] || { icon: '🔲', label: tab };
                        const isDark = formData.tabDarkModes[tab];
                        return (
                          <div key={tab} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            background: t.bgInput,
                            borderRadius: '12px',
                            border: `1px solid ${isDark ? '#6366f1' : '#222222'}`,
                            transition: 'border-color 0.2s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: isDark ? '#c4b5fd' : '#e0e0e0' }}>
                                {meta.label}
                              </span>
                            </div>
                            {/* Toggle switch */}
                            <div
                              onClick={() => handleInputChange('tabDarkModes', {
                                ...formData.tabDarkModes,
                                [tab]: !isDark
                              })}
                              style={{
                                width: '44px',
                                height: '24px',
                                borderRadius: '12px',
                                background: isDark ? '#6366f1' : '#111111',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.25s',
                                flexShrink: 0
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '3px',
                                left: isDark ? '23px' : '3px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                transition: 'left 0.25s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
                              }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Info card */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3050 100%)',
                  borderRadius: '12px',
                  border: '1px solid #2563eb40',
                  padding: '18px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', marginBottom: '4px' }}>
                      Pro Tip
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                      Use <strong style={{ color: '#c4b5fd' }}>dark mode</strong> for Reports, Staff, and Waiters to reduce eye strain during extended sessions. Use <strong style={{ color: '#fbbf24' }}>light mode</strong> for Dashboard and CRM in bright-lit environments.
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔔 Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>Enable Notifications</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '4px' }}>Receive alerts for important events</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('enableNotifications', !formData.enableNotifications)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableNotifications ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.enableNotifications ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🖥️ Display Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>Low Stock Alerts</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '4px' }}>Alert when inventory is running low</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('lowStockAlert', !formData.lowStockAlert)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.lowStockAlert ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.lowStockAlert ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    💾 Backup & Restore
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button
                      onClick={handleBackup}
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '16px 20px' : '14px 20px',
                        background: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: screenSize === 'small' ? '16px' : '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: screenSize === 'small' ? '56px' : '52px'
                      }}
                    >
                      Download Backup
                    </button>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Restore Backup
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'refunds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    💸 Refund Management
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#6b7280', lineHeight: '1.6' }}>
                      Process refunds for completed payments. All refunds are processed through Razorpay.
                    </div>
                    <button
                      onClick={() => {
                        if (typeof window === 'undefined') return;
                        try {
                          const payments = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
                          const successfulPayments = payments.filter(p => p.status === 'success');
                          setAlertMessage(`Found ${successfulPayments.length} successful payments available for refund`);
                          setShowAlert(true);
                        } catch (e) {
                          setAlertMessage('Error loading payment transactions');
                          setShowAlert(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '16px 20px' : '14px 20px',
                        background: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: screenSize === 'small' ? '16px' : '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: screenSize === 'small' ? '56px' : '52px'
                      }}
                    >
                      Load Payment Transactions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'compliance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🔒 PCI DSS Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#6b7280', lineHeight: '1.6' }}>
                      Payment Card Industry Data Security Standard compliance settings for secure payment processing.
                    </div>
                    {[
                      { key: 'enablePciDssLogging', label: 'Enable PCI DSS compliant logging (mask sensitive data)' },
                      { key: 'enableCardTokenization', label: 'Enable card tokenization (save cards securely)' },
                      { key: 'requireCvvForSavedCards', label: 'Require CVV for saved card payments' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111', marginBottom: '8px' }}>
                        Card data retention period (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={formData.cardDataRetentionDays || 30}
                        onChange={(e) => handleInputChange('cardDataRetentionDays', parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#000000' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0a0a0a',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '8px' }}>
                        Maximum time to retain card data for security compliance
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    🛡️ GDPR Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#6b7280', lineHeight: '1.6' }}>
                      General Data Protection Regulation compliance for customer data handling.
                    </div>
                    {[
                      { key: 'enableGdprCompliance', label: 'Enable GDPR compliance mode' },
                      { key: 'enableDataExport', label: 'Allow customer data export requests' },
                      { key: 'enableDataDeletion', label: 'Allow customer data deletion requests' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#000000' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#222222' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'debug' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🐛 Debug Information
                  </div>
                  <div style={{ fontSize: '13px', color: t.textSub, lineHeight: '1.8' }}>
                    <div><strong>Browser:</strong> {navigator.userAgent}</div>
                    <div><strong>Platform:</strong> {navigator.platform}</div>
                    <div><strong>Language:</strong> {navigator.language}</div>
                    <div><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</div>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    📊 Error Tracking & Logging
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'enableErrorTracking', label: 'Enable Error Tracking', desc: 'Track and log application errors automatically' },
                      { key: 'autoSaveLogs', label: 'Auto Save Logs', desc: 'Automatically save logs to local storage' },
                      { key: 'enableCrashDetection', label: 'Enable Crash Detection', desc: 'Detect and report application crashes' }
                    ].map(setting => (
                      <div key={setting.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '13px', color: t.text, marginBottom: '2px' }}>{setting.label}</div>
                          <div style={{ fontSize: '11px', color: t.textSub }}>{setting.desc}</div>
                        </div>
                        <button
                          onClick={() => handleInputChange(setting.key, !formData[setting.key])}
                          style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '12px',
                            background: formData[setting.key] ? '#10b981' : '#374151',
                            position: 'relative',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: formData[setting.key] ? '22px' : '2px',
                            transition: 'left 0.2s'
                          }} />
                        </button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: t.text }}>Log Retention (days)</label>
                      <input
                        type="number"
                        value={formData.logRetentionDays}
                        onChange={(e) => handleInputChange('logRetentionDays', parseInt(e.target.value) || 30)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${t.border}`,
                          background: t.bg,
                          color: t.text,
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: t.text }}>Crash Report Email</label>
                      <input
                        type="email"
                        value={formData.crashReportEmail}
                        onChange={(e) => handleInputChange('crashReportEmail', e.target.value)}
                        placeholder="admin@example.com"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${t.border}`,
                          background: t.bg,
                          color: t.text,
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: t.text }}>Log Level</label>
                      <select
                        value={formData.logLevel}
                        onChange={(e) => handleInputChange('logLevel', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${t.border}`,
                          background: t.bg,
                          color: t.text,
                          fontSize: '13px'
                        }}
                      >
                        <option value="error">Error Only</option>
                        <option value="warn">Warning & Above</option>
                        <option value="info">Info & Above</option>
                        <option value="debug">Debug & Above</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const logs = localStorage.getItem('error_logs');
                            if (logs) {
                              const blob = new Blob([logs], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } else {
                              alert('No logs found');
                            }
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Download Logs
                      </button>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && confirm('Clear all saved logs?')) {
                            localStorage.removeItem('error_logs');
                            alert('Logs cleared');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab-specific settings */}
            {activeSection.startsWith('tab-') && (() => {
              const tabId = activeSection.replace('tab-', '');
              const tabSettings = formData[tabId] || {};
              const tabConfig = {
                'dashboard': { icon: '📊', label: 'Dashboard', settings: [
                  { key: 'enabled', label: 'Enable Dashboard Tab', desc: 'Show/hide the Dashboard tab' },
                  { key: 'showStats', label: 'Show Statistics', desc: 'Display key metrics', type: 'toggle' },
                  { key: 'showCharts', label: 'Show Charts', desc: 'Display visual charts', type: 'toggle' },
                  { key: 'showSalesSummary', label: 'Show Sales Summary', desc: 'Display daily sales summary', type: 'toggle' },
                  { key: 'showTopItems', label: 'Show Top Items', desc: 'Display best-selling items', type: 'toggle' },
                  { key: 'showHourlyBreakdown', label: 'Show Hourly Breakdown', desc: 'Display hourly sales chart', type: 'toggle' },
                  { key: 'refreshInterval', label: 'Refresh Interval (min)', desc: 'Dashboard refresh frequency', type: 'number' },
                  { key: 'defaultTimeRange', label: 'Default Time Range', desc: 'Default dashboard time range', type: 'text' }
                ]},
                'reports': { icon: '📈', label: 'Reports', settings: [
                  { key: 'enabled', label: 'Enable Reports Tab', desc: 'Show/hide the Reports tab' },
                  { key: 'autoGenerate', label: 'Auto Generate', desc: 'Automatically generate daily reports', type: 'toggle' },
                  { key: 'reportTime', label: 'Report Time', desc: 'Time to generate reports', type: 'time' },
                  { key: 'includeTaxBreakdown', label: 'Include Tax Breakdown', desc: 'Show GST/tax details in reports', type: 'toggle' },
                  { key: 'includeStaffPerformance', label: 'Include Staff Performance', desc: 'Show staff metrics in reports', type: 'toggle' },
                  { key: 'exportFormat', label: 'Export Format', desc: 'Default export format', type: 'text' },
                  { key: 'reportRetentionDays', label: 'Report Retention (days)', desc: 'How long to keep reports', type: 'number' }
                ]},
                'crm': { icon: '👥', label: 'CRM', settings: [
                  { key: 'enabled', label: 'Enable CRM Tab', desc: 'Show/hide the CRM tab' },
                  { key: 'showLoyalty', label: 'Show Loyalty', desc: 'Display customer loyalty points', type: 'toggle' },
                  { key: 'allowGuestCheckout', label: 'Guest Checkout', desc: 'Allow checkout without registration', type: 'toggle' },
                  { key: 'requirePhone', label: 'Require Phone', desc: 'Require phone number for customers', type: 'toggle' },
                  { key: 'enableLoyaltyPoints', label: 'Enable Loyalty Points', desc: 'Activate loyalty point system', type: 'toggle' },
                  { key: 'pointsPerRupee', label: 'Points per ₹', desc: 'Loyalty points earned per rupee', type: 'number' },
                  { key: 'redemptionRate', label: 'Redemption Rate', desc: 'Points needed for ₹1 discount', type: 'number' },
                  { key: 'showOrderHistory', label: 'Show Order History', desc: 'Display customer past orders', type: 'toggle' }
                ]},
                'staff': { icon: '👨‍🍳', label: 'Staff', settings: [
                  { key: 'enabled', label: 'Enable Staff Tab', desc: 'Show/hide the Staff tab' },
                  { key: 'showPerformance', label: 'Show Performance', desc: 'Display staff performance metrics', type: 'toggle' },
                  { key: 'allowSchedule', label: 'Allow Scheduling', desc: 'Enable staff scheduling', type: 'toggle' },
                  { key: 'requireClockIn', label: 'Require Clock In', desc: 'Staff must clock in to work', type: 'toggle' },
                  { key: 'trackBreakTime', label: 'Track Break Time', desc: 'Track staff break durations', type: 'toggle' },
                  { key: 'showSalesPerStaff', label: 'Show Sales per Staff', desc: 'Display individual sales metrics', type: 'toggle' },
                  { key: 'autoAssignOrders', label: 'Auto Assign Orders', desc: 'Automatically assign orders to staff', type: 'toggle' },
                  { key: 'maxOrdersPerStaff', label: 'Max Orders per Staff', desc: 'Maximum concurrent orders', type: 'number' }
                ]},
                'menu': { icon: '🍽️', label: 'Menu', settings: [
                  { key: 'enabled', label: 'Enable Menu Tab', desc: 'Show/hide the Menu tab' },
                  { key: 'showImages', label: 'Show Images', desc: 'Display item images', type: 'toggle' },
                  { key: 'allowCustomItems', label: 'Custom Items', desc: 'Allow adding custom menu items', type: 'toggle' },
                  { key: 'showStockLevel', label: 'Show Stock Level', desc: 'Display inventory on menu items', type: 'toggle' },
                  { key: 'enableCategories', label: 'Enable Categories', desc: 'Use menu categorization', type: 'toggle' },
                  { key: 'showModifiers', label: 'Show Modifiers', desc: 'Display item modifiers/add-ons', type: 'toggle' },
                  { key: 'allowPriceOverride', label: 'Allow Price Override', desc: 'Staff can change item prices', type: 'toggle' },
                  { key: 'hideOutOfStock', label: 'Hide Out of Stock', desc: 'Auto-hide items with zero stock', type: 'toggle' }
                ],
                hasLayoutSettings: true,
                layoutLabel: 'Menu Layout' },
                'inventory': { icon: '📦', label: 'Inventory', settings: [
                  { key: 'enabled', label: 'Enable Inventory Tab', desc: 'Show/hide the Inventory tab' },
                  { key: 'lowStockAlert', label: 'Low Stock Alert', desc: 'Alert when stock is low', type: 'toggle' },
                  { key: 'autoReorder', label: 'Auto Reorder', desc: 'Suggest reorder quantities', type: 'toggle' },
                  { key: 'lowStockThreshold', label: 'Low Stock Threshold', desc: 'Stock level for alerts', type: 'number' },
                  { key: 'trackWaste', label: 'Track Waste', desc: 'Record waste in inventory', type: 'toggle' },
                  { key: 'enableStockTransfer', label: 'Enable Stock Transfer', desc: 'Allow stock between locations', type: 'toggle' },
                  { key: 'showCost', label: 'Show Cost', desc: 'Display item cost prices', type: 'toggle' },
                  { key: 'autoDeductOnSale', label: 'Auto Deduct on Sale', desc: 'Reduce stock when items sold', type: 'toggle' }
                ]},
                'recipes': { icon: '📝', label: 'Recipes', settings: [
                  { key: 'enabled', label: 'Enable Recipes Tab', desc: 'Show/hide the Recipes tab' },
                  { key: 'showCost', label: 'Show Cost', desc: 'Display recipe cost breakdown', type: 'toggle' },
                  { key: 'showYield', label: 'Show Yield', desc: 'Display recipe yield information', type: 'toggle' },
                  { key: 'enableScaling', label: 'Enable Scaling', desc: 'Allow recipe batch scaling', type: 'toggle' },
                  { key: 'showAllergens', label: 'Show Allergens', desc: 'Display allergen information', type: 'toggle' },
                  { key: 'trackPrepTime', label: 'Track Prep Time', desc: 'Record preparation time', type: 'toggle' },
                  { key: 'linkToInventory', label: 'Link to Inventory', desc: 'Auto-update ingredients', type: 'toggle' },
                  { key: 'showNutrition', label: 'Show Nutrition', desc: 'Display nutritional info', type: 'toggle' }
                ]},
                'waste': { icon: '🗑️', label: 'Waste', settings: [
                  { key: 'enabled', label: 'Enable Waste Tab', desc: 'Show/hide the Waste tab' },
                  { key: 'requireReason', label: 'Require Reason', desc: 'Mandatory reason for waste entry', type: 'toggle' },
                  { key: 'trackCost', label: 'Track Cost', desc: 'Calculate waste cost impact', type: 'toggle' },
                  { key: 'requireStaff', label: 'Require Staff', desc: 'Assign staff to waste entries', type: 'toggle' },
                  { key: 'enablePhoto', label: 'Enable Photo', desc: 'Attach photos to waste records', type: 'toggle' },
                  { key: 'showWasteTrend', label: 'Show Waste Trend', desc: 'Display waste over time', type: 'toggle' },
                  { key: 'autoReport', label: 'Auto Report', desc: 'Generate weekly waste reports', type: 'toggle' },
                  { key: 'wasteCategories', label: 'Waste Categories', desc: 'Custom waste categories', type: 'text' }
                ]},
                'reservations': { icon: '📅', label: 'Reservations', settings: [
                  { key: 'enabled', label: 'Enable Reservations Tab', desc: 'Show/hide the Reservations tab' },
                  { key: 'autoConfirm', label: 'Auto Confirm', desc: 'Automatically confirm reservations', type: 'toggle' },
                  { key: 'maxAdvanceDays', label: 'Max Advance Days', desc: 'Maximum days in advance for booking', type: 'number' },
                  { key: 'requireDeposit', label: 'Require Deposit', desc: 'Require deposit for reservations', type: 'toggle' },
                  { key: 'depositAmount', label: 'Deposit Amount (₹)', desc: 'Default deposit amount', type: 'number' },
                  { key: 'allowCancellation', label: 'Allow Cancellation', desc: 'Customers can cancel online', type: 'toggle' },
                  { key: 'cancellationHours', label: 'Cancellation Hours', desc: 'Min hours before cancellation', type: 'number' },
                  { key: 'showNoShow', label: 'Show No-Show', desc: 'Track no-show reservations', type: 'toggle' }
                ]},
                'tokens': { icon: '🎫', label: 'Tokens', settings: [
                  { key: 'enabled', label: 'Enable Token System', desc: 'Enable token-based ordering' },
                  { key: 'prefix', label: 'Token Prefix', desc: 'Prefix for token numbers (e.g., T-)', type: 'text' },
                  { key: 'autoReset', label: 'Auto Reset Daily', desc: 'Reset token counter at midnight' },
                  { key: 'tvModePin', label: 'TV Mode PIN', desc: 'PIN to enable TV display mode', type: 'text' },
                  { key: 'refreshInterval', label: 'Refresh Interval (sec)', desc: 'How often to update TV display', type: 'number' },
                  { key: 'hideReadyTokens', label: 'Hide Ready Tokens', desc: 'Remove tokens from TV when ready' },
                  { key: 'showTableNumber', label: 'Show Table Number', desc: 'Display table on token cards' },
                  { key: 'showItemCount', label: 'Show Item Count', desc: 'Display number of items on tokens' },
                  { key: 'showTotalAmount', label: 'Show Total Amount', desc: 'Display order total on tokens' },
                  { key: 'autoCompleteReady', label: 'Auto-Complete Ready', desc: 'Mark tokens complete when ready' },
                  { key: 'tokenStartNumber', label: 'Start Number', desc: 'Starting token number', type: 'number' }
                ]},
                'tables': { icon: '🪑', label: 'Tables', settings: [
                  { key: 'enabled', label: 'Enable Tables Tab', desc: 'Show/hide the Tables tab' },
                  { key: 'showCapacity', label: 'Show Capacity', desc: 'Display table capacity on cards' },
                  { key: 'allowMerge', label: 'Allow Merge', desc: 'Allow merging multiple tables' },
                  { key: 'autoClearOnPayment', label: 'Auto-Clear on Payment', desc: 'Automatically clear table when payment completed', type: 'toggle' },
                  { key: 'requireStaffAssignment', label: 'Require Staff Assignment', desc: 'Require staff assignment before seating', type: 'toggle' },
                  { key: 'defaultCapacity', label: 'Default Capacity', desc: 'Default seats for new tables', type: 'number' },
                  { key: 'tableTimeout', label: 'Table Timeout (min)', desc: 'Auto-clear after inactivity (0 = disabled)', type: 'number' },
                  { key: 'showOccupiedTime', label: 'Show Occupied Time', desc: 'Display how long table has been occupied', type: 'toggle' },
                  { key: 'enableQRGeneration', label: 'Enable QR Codes', desc: 'Allow QR code generation for tables', type: 'toggle' },
                  { key: 'allowUnassignedSeating', label: 'Allow Unassigned Seating', desc: 'Allow seating without staff assignment', type: 'toggle' },
                  { key: 'showTableAnalytics', label: 'Show Analytics', desc: 'Display table performance analytics', type: 'toggle' },
                  { key: 'sessionTracking', label: 'Session Tracking', desc: 'Track table sessions for analytics', type: 'toggle' },
                  { key: 'maxMergeTables', label: 'Max Merge Tables', desc: 'Maximum tables that can be merged', type: 'number' },
                  { key: 'tableNumbering', label: 'Table Numbering', desc: 'Auto-numbering scheme (T1, T2, etc)', type: 'text' },
                  { key: 'elapsedThresholdWarning', label: 'Warning Threshold (min)', desc: 'Elapsed time before warning color (yellow)', type: 'number' },
                  { key: 'elapsedThresholdCritical', label: 'Critical Threshold (min)', desc: 'Elapsed time before critical color (red)', type: 'number' },
                  { key: 'upcomingReservationWindow', label: 'Reservation Window (min)', desc: 'Show reservations within this window', type: 'number' }
                ],
                hasManagement: true,
                managementLabel: 'Manage Tables' },
                'waiters': { icon: '🛎️', label: 'Waiters', settings: [
                  { key: 'enabled', label: 'Enable Waiters Tab', desc: 'Show/hide the Waiters tab' },
                  { key: 'showAssignedOrders', label: 'Show Assigned Orders', desc: 'Display orders assigned to waiters' },
                  { key: 'allowCallWaiter', label: 'Allow Call Waiter', desc: 'Enable call waiter feature' },
                  { key: 'autoAssignTables', label: 'Auto Assign Tables', desc: 'Automatically assign waiters to tables', type: 'toggle' },
                  { key: 'maxTablesPerWaiter', label: 'Max Tables per Waiter', desc: 'Maximum tables a waiter can handle', type: 'number' },
                  { key: 'showPerformance', label: 'Show Performance', desc: 'Display waiter performance metrics', type: 'toggle' },
                  { key: 'enableRating', label: 'Enable Rating', desc: 'Allow customer ratings for waiters', type: 'toggle' },
                  { key: 'trackResponseTime', label: 'Track Response Time', desc: 'Measure waiter response times', type: 'toggle' }
                ]},
                'kitchen': { icon: '👨‍🍳', label: 'Kitchen', settings: [
                  { key: 'enabled', label: 'Enable Kitchen Tab', desc: 'Show/hide the Kitchen tab' },
                  { key: 'showTimers', label: 'Show Timers', desc: 'Display order preparation timers' },
                  { key: 'autoPrintKOT', label: 'Auto Print KOT', desc: 'Automatically print KOT tickets' },
                  { key: 'enableStations', label: 'Enable Stations', desc: 'Use kitchen station system', type: 'toggle' },
                  { key: 'priorityOrders', label: 'Priority Orders', desc: 'Highlight priority orders', type: 'toggle' },
                  { key: 'showAllergenAlerts', label: 'Show Allergen Alerts', desc: 'Display allergy warnings', type: 'toggle' },
                  { key: 'autoRouteItems', label: 'Auto Route Items', desc: 'Send items to correct stations', type: 'toggle' },
                  { key: 'prepTimeTracking', label: 'Prep Time Tracking', desc: 'Track item preparation times', type: 'toggle' }
                ]},
                'onlineOrdering': { icon: '🌐', label: 'Online Ordering', settings: [
                  { key: 'enabled', label: 'Enable Online Ordering', desc: 'Enable online ordering platform' },
                  { key: 'autoAccept', label: 'Auto Accept', desc: 'Automatically accept online orders' },
                  { key: 'preparationTime', label: 'Preparation Time (min)', desc: 'Default preparation time', type: 'number' },
                  { key: 'enableDelivery', label: 'Enable Delivery', desc: 'Offer delivery option', type: 'toggle' },
                  { key: 'deliveryRadius', label: 'Delivery Radius (km)', desc: 'Maximum delivery distance', type: 'number' },
                  { key: 'deliveryFee', label: 'Delivery Fee (₹)', desc: 'Default delivery charge', type: 'number' },
                  { key: 'minOrderAmount', label: 'Min Order Amount (₹)', desc: 'Minimum order for delivery', type: 'number' },
                  { key: 'showEstimatedTime', label: 'Show Estimated Time', desc: 'Display prep time to customers', type: 'toggle' }
                ]}
              };
              const config = tabConfig[tabId];
              if (!config) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    padding: '16px',
                    background: t.bgEle,
                    borderRadius: '8px',
                    border: `1px solid ${t.border}`
                  }}>
                    <div style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                      {config.icon} {config.label} Settings
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {config.settings.map(setting => (
                        <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{setting.label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{setting.desc}</div>
                          </div>
                          {setting.type === 'time' ? (
                            <input
                              type="time"
                              value={tabSettings[setting.key] || '23:00'}
                              onChange={(e) => {
                                handleInputChange(tabId, { ...tabSettings, [setting.key]: e.target.value });
                              }}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px' }}
                            />
                          ) : setting.type === 'number' ? (
                            <input
                              type="number"
                              value={tabSettings[setting.key] || 0}
                              onChange={(e) => {
                                handleInputChange(tabId, { ...tabSettings, [setting.key]: parseInt(e.target.value) || 0 });
                              }}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px', width: '80px' }}
                            />
                          ) : setting.type === 'text' ? (
                            <input
                              type="text"
                              value={tabSettings[setting.key] || ''}
                              onChange={(e) => {
                                handleInputChange(tabId, { ...tabSettings, [setting.key]: e.target.value });
                              }}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px', width: '100px' }}
                            />
                          ) : (
                            <div
                              onClick={() => {
                                handleInputChange(tabId, { ...tabSettings, [setting.key]: !tabSettings[setting.key] });
                              }}
                              style={{
                                width: '40px', height: '22px', flexShrink: 0,
                                background: tabSettings[setting.key] ? '#10b981' : '#000000',
                                borderRadius: '11px', position: 'relative', cursor: 'pointer',
                                transition: 'background 0.2s', marginLeft: '12px'
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: '3px',
                                left: tabSettings[setting.key] ? '21px' : '3px',
                                width: '16px', height: '16px',
                                background: t.bgInput, borderRadius: '50%',
                                transition: 'left 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table Management Section */}
                  {config.hasManagement && tabId === 'tables' && (
                    <div style={{
                      padding: '16px',
                      background: t.bgEle,
                      borderRadius: '8px',
                      border: `1px solid ${t.border}`
                    }}>
                      <div style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                        🪑 {config.managementLabel}
                      </div>
                      <TableManagementPanel tables={tables} setTables={setTables} darkMode={darkMode} />
                    </div>
                  )}

                  {/* Menu Layout Settings Section */}
                  {config.hasLayoutSettings && tabId === 'menu' && (
                    <div style={{
                      padding: '16px',
                      background: t.bgEle,
                      borderRadius: '8px',
                      border: `1px solid ${t.border}`
                    }}>
                      <div style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                        🎨 {config.layoutLabel}
                      </div>
                      <MenuLayoutSettings 
                        menuLayout={formData.menuLayout || {}}
                        onMenuLayoutChange={(newLayout) => handleInputChange('menuLayout', newLayout)}
                        darkMode={darkMode}
                        screenSize={screenSize}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

    </>
  );

  return (
    <>
    <style>{`
      .settings-row-btn { -webkit-tap-highlight-color: transparent; transition: background 0.12s; }
      .settings-row-btn:active { background: rgba(99,102,241,0.08) !important; }
    `}</style>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: screenSize === 'small'
        ? (darkMode ? '#0f0f1e' : '#f2f2f7')
        : (darkMode ? '#000000' : '#f5f7fa'),
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE LAYOUT — two-screen: list → detail
          ══════════════════════════════════════════════════════════════ */}
      {screenSize === 'small' && (
        <>
          {/* ── Mobile Nav Header ─────────────────────────────────── */}
          <div style={{
            background: darkMode
              ? 'rgba(15,15,30,0.94)'
              : 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 200,
          }}>
            {/* Left: back button */}
            <button
              onClick={() => {
                if (isMobileList) {
                  onNavigate('orders');
                } else {
                  _mobileEnteredSection.current = false;
                  setActiveSection('__list__');
                }
              }}
              style={{
                background: 'none', border: 'none',
                padding: '8px', margin: '-8px',
                cursor: 'pointer', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '4px',
                color: '#6366f1', fontSize: '16px', fontWeight: '500',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '20px' }}>‹</span>
              <span>{isMobileList ? 'Back' : 'Settings'}</span>
            </button>

            {/* Center: title */}
            <span style={{
              fontSize: '17px', fontWeight: '600',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              position: 'absolute', left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              {isMobileList ? 'Settings' : (activeSectionMeta?.label ?? 'Settings')}
            </span>

            {/* Right: save button (only in detail view when changes) */}
            {!isMobileList && hasChanges && (
              <button
                onClick={handleSave}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Save
              </button>
            )}
            {(isMobileList || !hasChanges) && <div style={{ width: '60px' }} />}
          </div>

          {/* ── SCREEN A: Section List ─────────────────────────────── */}
          {isMobileList && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
              {sections.map((group, gi) => (
                <div key={group.group} style={{ marginBottom: '28px' }}>
                  {/* Group label */}
                  <div style={{
                    fontSize: '12px', fontWeight: '700',
                    color: darkMode ? '#6366f1' : '#6366f1',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    paddingLeft: '4px', marginBottom: '8px',
                    padding: '4px 8px',
                    background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.1)',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {group.group}
                  </div>

                  {/* Grouped rows card */}
                  <div style={{
                    background: darkMode ? '#1c1c2e' : '#ffffff',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}>
                    {group.items.map((section, idx) => (
                      <button
                        key={section.id}
                        className="settings-row-btn"
                        onClick={() => handleMobileNav(section.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: idx > 0
                            ? `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                            : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {/* Icon bubble */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '9px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                        }}>
                          {section.icon}
                        </div>

                        {/* Label */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '16px', fontWeight: '500',
                            color: darkMode ? '#f9fafb' : '#0a0a0a',
                          }}>
                            {section.label}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#9ca3af' : '#6b7280',
                            marginTop: '2px'
                          }}>
                            {section.description || 'Configure settings'}
                          </div>
                        </div>

                        {/* Chevron */}
                        <span style={{
                          fontSize: '18px',
                          color: darkMode ? '#111111' : '#c7c7cc',
                          flexShrink: 0,
                        }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SCREEN B: Section Detail ───────────────────────────── */}
          {!isMobileList && (
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '0 0 100px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {/* Mobile section header */}
              <div style={{
                padding: '16px',
                background: darkMode ? '#0a0a0a' : '#ffffff',
                borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '4px' }}>
                  {activeSectionMeta?.icon} {activeSectionMeta?.label}
                </div>
                <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  {activeSectionMeta?.description || 'Configure these settings'}
                </div>
              </div>

              {/* Mobile section content */}
              <div style={{ padding: '16px' }}>
                {renderSectionContent()}
              </div>

              {/* Mobile save bar (sticky bottom) */}
              {hasChanges && (
                <div style={{
                  position: 'fixed',
                  bottom: 'calc(70px + env(safe-area-inset-bottom))',
                  left: '12px', right: '12px',
                  background: darkMode
                    ? 'rgba(15,15,30,0.95)'
                    : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex', gap: '10px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  zIndex: 300,
                }}>
                  <button
                    onClick={handleReset}
                    style={{
                      flex: 1, padding: '13px',
                      background: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                      color: darkMode ? '#d1d5db' : '#111111',
                      border: 'none', borderRadius: '12px',
                      fontSize: '15px', fontWeight: '500',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      flex: 2, padding: '13px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      border: 'none', borderRadius: '12px',
                      fontSize: '15px', fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP / TABLET LAYOUT
          ══════════════════════════════════════════════════════════════ */}
      {screenSize !== 'small' && (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: screenSize === 'small' ? '0' : (screenSize === 'medium' ? '260px' : '320px'),
          background: darkMode ? '#0a0a0a' : '#ffffff',
          borderRight: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
          padding: screenSize === 'small' ? '0' : '20px',
          overflowY: 'auto',
          flexShrink: 0,
          display: screenSize === 'small' ? 'none' : 'block'
        }}>
          <div style={{ margin: '0 0 24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '4px' }}>
              ⚙️ Settings Studio
            </div>
            <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginBottom: '14px' }}>
              Complete Configuration Management System
            </div>

            {/* Global Settings Filter Search Bar */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search settings..."
                onChange={(e) => {
                  const q = e.target.value.toLowerCase();
                  if (!q) return;
                  for (const g of sections) {
                    const found = g.items.find(i => i.label.toLowerCase().includes(q) || i.id.includes(q));
                    if (found) {
                      setActiveSection(found.id);
                      break;
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: darkMode ? '#111111' : '#f3f4f6',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          {sections.map(group => (
            <div key={group.group} style={{ marginBottom: '20px' }}>
              <div style={{
                margin: '0 0 12px',
                fontSize: '11px', fontWeight: '700',
                color: darkMode ? '#6366f1' : '#6366f1',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '4px 8px',
                background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.1)',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      padding: '12px 16px',
                      background: activeSection === section.id 
                        ? (darkMode ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')
                        : 'transparent',
                      color: activeSection === section.id ? '#ffffff' : (darkMode ? '#e0e0e0' : '#111111'),
                      border: activeSection === section.id ? 'none' : `1px solid ${darkMode ? '#333333' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      textAlign: 'left', width: '100%',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: activeSection === section.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{section.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{section.label}</div>
                      <div style={{ fontSize: '11px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>
                        {section.description || 'Configure settings'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop main content */}
        <div style={{
          flex: 1,
          padding: screenSize === 'small' ? '16px' : '24px',
          overflow: 'auto',
          background: darkMode ? '#000000' : '#f5f7fa',
          minHeight: 0
        }}>
          <div style={{
            background: darkMode ? '#0a0a0a' : '#ffffff',
            borderRadius: screenSize === 'small' ? '12px' : '16px',
            padding: screenSize === 'small' ? '20px' : '28px',
            width: '100%',
            maxWidth: '100%',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            margin: '0 auto',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div style={{
              margin: '0 0 24px',
              paddingBottom: '20px',
              borderBottom: `2px solid ${darkMode ? '#6366f1' : '#e5e7eb'}`
            }}>
              <div style={{ fontSize: screenSize === 'small' ? '20px' : '22px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '8px' }}>
                {activeSectionMeta?.icon} {activeSectionMeta?.label}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                {activeSectionMeta?.description || 'Configure these settings to customize your experience'}
              </div>
            </div>

            {renderSectionContent()}

            {/* Desktop action buttons */}
            <div style={{
              display: 'flex', gap: '12px',
              marginTop: '24px', paddingTop: '20px',
              borderTop: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                style={{
                  padding: '10px 24px',
                  background: hasChanges ? (darkMode ? '#111111' : '#f9fafb') : (darkMode ? '#000000' : '#f3f4f6'),
                  color: hasChanges ? (darkMode ? '#e0e0e0' : '#111111') : '#9ca3af',
                  border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                  borderRadius: '10px', fontSize: '14px', fontWeight: '500',
                  cursor: hasChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Reset</button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                style={{
                  padding: '10px 24px',
                  background: hasChanges ? '#6366f1' : (darkMode ? '#111111' : '#e5e7eb'),
                  color: hasChanges ? '#ffffff' : '#9ca3af',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: hasChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Alert Toast (both layouts) ────────────────────────────── */}
      {showAlert && (
        <div style={{
          position: 'fixed',
          top: screenSize === 'small' ? 'auto' : '20px',
          bottom: screenSize === 'small' ? 'calc(80px + env(safe-area-inset-bottom))' : 'auto',
          left: screenSize === 'small' ? '16px' : 'auto',
          right: screenSize === 'small' ? '16px' : '20px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{
            background: alertType === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: screenSize === 'small' ? '14px 18px' : '16px 24px',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            fontSize: '14px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: screenSize === 'small' ? 'unset' : '300px',
          }}>
            <span style={{ fontSize: '18px' }}>{alertType === 'success' ? '✓' : '⚠️'}</span>
            <span>{alertMessage}</span>
          </div>
        </div>
      )}
    </div>
    <style>{`
      @keyframes slideIn {
        from { transform: translateY(8px); opacity: 0; }
        to   { transform: translateY(0);   opacity: 1; }
      }
    `}</style>
    </>
  );
}

export default SimpleSettings;

