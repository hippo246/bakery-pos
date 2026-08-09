// Terminal Settings Section
// UI for configuring POS terminals in multi-terminal setup

import React, { useState, useEffect } from 'react';
import { C, card, btn, input, label } from '../../../styles/theme';
import { useTerminal } from '../../../terminal/TerminalContext.jsx';
import ConfirmDialog from '../../common/ConfirmDialog';

export default function TerminalSettingsSection() {
  const { 
    currentTerminal, 
    allTerminals, 
    selectTerminal, 
    createTerminal, 
    updateTerminal,
    getOnlineTerminals 
  } = useTerminal();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTerminal, setDeletingTerminal] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    location: 'main',
    type: 'pos',
    defaultOrderType: 'dine_in',
    printers: [],
    enabledFeatures: {
      kitchenDisplay: true,
      deliveryPlatform: true,
      tableManagement: true,
      printerManagement: true
    }
  });
  
  const onlineTerminals = getOnlineTerminals();
  
  const handleAddTerminal = () => {
    setForm({
      name: '',
      location: 'main',
      type: 'pos',
      defaultOrderType: 'dine_in',
      printers: [],
      enabledFeatures: {
        kitchenDisplay: true,
        deliveryPlatform: true,
        tableManagement: true,
        printerManagement: true
      }
    });
    setShowAddModal(true);
  };
  
  const handleEditTerminal = (terminal) => {
    setEditingTerminal(terminal);
    setForm({
      name: terminal.name,
      location: terminal.location,
      type: terminal.type,
      defaultOrderType: terminal.defaultOrderType,
      printers: terminal.printers || [],
      enabledFeatures: terminal.enabledFeatures || {
        kitchenDisplay: true,
        deliveryPlatform: true,
        tableManagement: true,
        printerManagement: true
      }
    });
    setShowEditModal(true);
  };
  
  const handleDeleteTerminal = (terminal) => {
    setDeletingTerminal(terminal);
    setShowDeleteDialog(true);
  };
  
  const handleSelectTerminal = (terminalId) => {
    selectTerminal(terminalId);
  };
  
  const handleSaveAdd = () => {
    if (!form.name.trim()) return;
    
    const newTerminal = createTerminal({
      name: form.name,
      location: form.location,
      type: form.type,
      defaultOrderType: form.defaultOrderType,
      printers: form.printers,
      enabledFeatures: form.enabledFeatures
    });
    
    setShowAddModal(false);
  };
  
  const handleSaveEdit = () => {
    if (!editingTerminal || !form.name.trim()) return;
    
    updateTerminal(editingTerminal.id, {
      name: form.name,
      location: form.location,
      type: form.type,
      defaultOrderType: form.defaultOrderType,
      printers: form.printers,
      enabledFeatures: form.enabledFeatures
    });
    
    setShowEditModal(false);
    setEditingTerminal(null);
  };
  
  const handleConfirmDelete = () => {
    if (!deletingTerminal) return;
    
    // Note: Terminal deletion would need to be implemented in TerminalManager
    // For now, we'll just close the dialog
    setShowDeleteDialog(false);
    setDeletingTerminal(null);
  };
  
  const isOnline = (terminalId) => {
    return onlineTerminals.some(t => t.id === terminalId);
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cafe-text-primary)', margin: 0 }}>
          Terminal Configuration
        </h2>
        <button
          onClick={handleAddTerminal}
          style={{
            background: 'var(--cafe-accent)',
            color: '#1A1208',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Add Terminal
        </button>
      </div>
      
      {/* Current Terminal Info */}
      {currentTerminal && (
        <div style={{
          background: 'var(--cafe-bg-card)',
          border: `1px solid var(--cafe-border-light)`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cafe-text-tertiary)', marginBottom: '8px' }}>
            CURRENT TERMINAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: isOnline(currentTerminal.id) ? 'var(--cafe-success-bg)' : 'var(--cafe-error-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {isOnline(currentTerminal.id) ? '●' : '○'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                {currentTerminal.name}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
                {currentTerminal.location} • {currentTerminal.type.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Terminals List */}
      <div style={{
        background: 'var(--cafe-bg-card)',
        border: `1px solid var(--cafe-border-light)`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--cafe-border-light)` }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-secondary)' }}>
            ALL TERMINALS ({allTerminals.length})
          </div>
        </div>
        
        {allTerminals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-tertiary)' }}>
            No terminals configured. Click "Add Terminal" to create one.
          </div>
        ) : (
          allTerminals.map(terminal => (
            <div
              key={terminal.id}
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid var(--cafe-border-light)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: currentTerminal?.id === terminal.id ? 'var(--cafe-bg-hover)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: isOnline(terminal.id) ? 'var(--cafe-success-bg)' : 'var(--cafe-error-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  {isOnline(terminal.id) ? '●' : '○'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {terminal.name}
                    {currentTerminal?.id === terminal.id && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        background: 'var(--cafe-accent)',
                        color: '#1A1208',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>
                    {terminal.location} • {terminal.type.toUpperCase()} • {terminal.defaultOrderType.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentTerminal?.id !== terminal.id && (
                  <button
                    onClick={() => handleSelectTerminal(terminal.id)}
                    style={{
                      background: 'var(--cafe-bg-surface)',
                      border: `1px solid var(--cafe-border-light)`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--cafe-text-secondary)'
                    }}
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleEditTerminal(terminal)}
                  style={{
                    background: 'var(--cafe-bg-surface)',
                    border: `1px solid var(--cafe-border-light)`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: 'var(--cafe-text-secondary)'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTerminal(terminal)}
                  style={{
                    background: 'var(--cafe-error-bg)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: 'var(--cafe-error)'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Add Terminal Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }} onClick={() => setShowAddModal(false)}>
          <div
            style={{
              background: 'var(--cafe-bg-card)',
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cafe-text-primary)', margin: '0 0 20px 0' }}>
              Add New Terminal
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Terminal Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
                placeholder="e.g., Counter Terminal 1"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Location
              </label>
              <select
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="main">Main Counter</option>
                <option value="drive_thru">Drive-Thru</option>
                <option value="kitchen">Kitchen</option>
                <option value="bar">Bar</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Terminal Type
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="pos">POS Terminal</option>
                <option value="kds">Kitchen Display</option>
                <option value="admin">Admin Terminal</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Default Order Type
              </label>
              <select
                value={form.defaultOrderType}
                onChange={e => setForm({ ...form, defaultOrderType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="dine_in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'var(--cafe-bg-surface)',
                  border: `1px solid var(--cafe-border-light)`,
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--cafe-text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdd}
                style={{
                  background: 'var(--cafe-accent)',
                  color: '#1A1208',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add Terminal
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Terminal Modal */}
      {showEditModal && editingTerminal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }} onClick={() => setShowEditModal(false)}>
          <div
            style={{
              background: 'var(--cafe-bg-card)',
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cafe-text-primary)', margin: '0 0 20px 0' }}>
              Edit Terminal
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Terminal Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Location
              </label>
              <select
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="main">Main Counter</option>
                <option value="drive_thru">Drive-Thru</option>
                <option value="kitchen">Kitchen</option>
                <option value="bar">Bar</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Terminal Type
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="pos">POS Terminal</option>
                <option value="kds">Kitchen Display</option>
                <option value="admin">Admin Terminal</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Default Order Type
              </label>
              <select
                value={form.defaultOrderType}
                onChange={e => setForm({ ...form, defaultOrderType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid var(--cafe-border-light)`,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="dine_in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'var(--cafe-bg-surface)',
                  border: `1px solid var(--cafe-border-light)`,
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--cafe-text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  background: 'var(--cafe-accent)',
                  color: '#1A1208',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Terminal"
        message={`Are you sure you want to delete "${deletingTerminal?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingTerminal(null);
        }}
      />
    </div>
  );
}
