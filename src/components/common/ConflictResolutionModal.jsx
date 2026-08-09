// Conflict Resolution Modal
// UI for staff to resolve conflicts when multiple terminals edit the same resource

import { useState } from 'react';

export default function ConflictResolutionModal({ 
  open, 
  conflict, 
  onResolve, 
  onCancel,
  onForceEdit 
}) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedResolution, setSelectedResolution] = useState(null);
  
  if (!open || !conflict) return null;
  
  const handleResolve = () => {
    if (selectedResolution === 'local') {
      onResolve({
        data: conflict.localVersion.data,
        notes: resolutionNotes
      });
    } else if (selectedResolution === 'remote') {
      onResolve({
        data: conflict.remoteVersion.data,
        notes: resolutionNotes
      });
    } else if (selectedResolution === 'merge') {
      // Simple merge for non-conflicting fields
      const merged = { ...conflict.localVersion.data };
      Object.keys(conflict.remoteVersion.data).forEach(key => {
        if (!merged[key]) {
          merged[key] = conflict.remoteVersion.data[key];
        }
      });
      onResolve({
        data: merged,
        notes: resolutionNotes
      });
    }
  };
  
  const handleForceEdit = () => {
    onForceEdit();
    onCancel();
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--cafe-bg-card)',
          border: `1px solid var(--cafe-border-light)`,
          borderRadius: '12px',
          padding: '24px',
          width: '500px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cafe-text-primary)', margin: '0 0 8px 0' }}>
            ⚠️ Conflict Detected
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)', margin: 0 }}>
            This resource is being edited by another terminal. Please resolve the conflict before proceeding.
          </p>
        </div>
        
        {/* Conflict Info */}
        <div style={{
          background: 'var(--cafe-bg-surface)',
          border: `1px solid var(--cafe-border-light)`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cafe-text-tertiary)', marginBottom: '8px' }}>
            CONFLICT DETAILS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-tertiary)', marginBottom: '4px' }}>
                Your Changes (Local)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                {conflict.localTerminal?.name || 'This Terminal'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
                Updated: {new Date(conflict.localVersion.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-tertiary)', marginBottom: '4px' }}>
                Other Terminal (Remote)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                {conflict.remoteTerminal?.name || conflict.remoteVersion.terminalId}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
                Updated: {new Date(conflict.remoteVersion.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {conflict.isLocked && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'var(--cafe-error-bg)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--cafe-error)'
            }}>
              🔒 Resource is locked by {conflict.lockedByName || conflict.lockedBy}
            </div>
          )}
        </div>
        
        {/* Resolution Options */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: '12px' }}>
            Choose Resolution:
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setSelectedResolution('local')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${selectedResolution === 'local' ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`,
                background: selectedResolution === 'local' ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                Keep My Changes
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
                Overwrite with your local version
              </div>
            </button>
            
            <button
              onClick={() => setSelectedResolution('remote')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${selectedResolution === 'remote' ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`,
                background: selectedResolution === 'remote' ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                Use Their Changes
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
                Overwrite with remote version
              </div>
            </button>
            
            {conflict.canAutoMerge && (
              <button
                onClick={() => setSelectedResolution('merge')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `2px solid ${selectedResolution === 'merge' ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`,
                  background: selectedResolution === 'merge' ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                  Auto-Merge
                </div>
                <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
                  Combine non-conflicting changes
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Resolution Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cafe-text-secondary)', display: 'block', marginBottom: '6px' }}>
            Resolution Notes (optional)
          </label>
          <textarea
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            placeholder="Add notes about this resolution..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: `1px solid var(--cafe-border-light)`,
              background: 'var(--cafe-bg-surface)',
              color: 'var(--cafe-text-primary)',
              fontSize: '14px',
              minHeight: '60px',
              resize: 'vertical'
            }}
          />
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleForceEdit}
            style={{
              background: 'var(--cafe-error-bg)',
              color: 'var(--cafe-error)',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Force Edit
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--cafe-bg-surface)',
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--cafe-text-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedResolution}
            style={{
              background: selectedResolution ? 'var(--cafe-accent)' : 'var(--cafe-bg-surface)',
              color: selectedResolution ? '#1A1208' : 'var(--cafe-text-tertiary)',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: selectedResolution ? 'pointer' : 'not-allowed',
              opacity: selectedResolution ? 1 : 0.5
            }}
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}
