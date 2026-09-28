import React, { useState } from 'react';
import { backupData, restoreData, clearOldData, getDataSize } from '../../../utils/data';

function DataManagementPanel({ darkMode }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [storageSize, setStorageSize] = useState(0);

  const handleExport = () => {
    setIsExporting(true);
    try {
      backupData();
      alert('Data exported successfully!');
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (confirm('This will replace all current data. Are you sure?')) {
            setIsImporting(true);
            const result = restoreData(data);
            if (result.success) {
              alert('Data imported successfully! Page will reload.');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              alert('Failed to import data: ' + result.message);
            }
          }
        } catch (error) {
          alert('Invalid backup file format');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('This will clear all order history, held orders, and temporary data. Settings and customers will be preserved. Are you sure?')) {
      const result = clearOldData();
      alert(`Cleared ${result.removed} items from ${result.total} total items`);
      setStorageSize(getDataSize());
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  React.useEffect(() => {
    setStorageSize(getDataSize());
  }, []);

  return (
    <div style={{
      padding: '24px',
      background: darkMode ? '#1a1a2e' : '#ffffff',
      color: darkMode ? '#e0e0e0' : '#1a1a1a'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
        Data Management
      </h2>

      {/* Storage Info */}
      <div style={{
        padding: '16px',
        background: darkMode ? '#16162a' : '#f9fafb',
        borderRadius: '8px',
        marginBottom: '24px',
        border: darkMode ? '1px solid #2a2a4a' : '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          Storage Usage
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
          {formatBytes(storageSize)}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Total localStorage usage
        </div>
      </div>

      {/* Export Section */}
      <div style={{
        padding: '16px',
        background: darkMode ? '#16162a' : '#f9fafb',
        borderRadius: '8px',
        marginBottom: '16px',
        border: darkMode ? '1px solid #2a2a4a' : '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          Export Data
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Download a backup of all your data including orders, customers, inventory, and settings.
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            padding: '10px 20px',
            background: isExporting ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isExporting ? 'not-allowed' : 'pointer'
          }}
        >
          {isExporting ? 'Exporting...' : 'Export Backup'}
        </button>
      </div>

      {/* Import Section */}
      <div style={{
        padding: '16px',
        background: darkMode ? '#16162a' : '#f9fafb',
        borderRadius: '8px',
        marginBottom: '16px',
        border: darkMode ? '1px solid #2a2a4a' : '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          Import Data
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Restore data from a backup file. This will replace all current data.
        </div>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={isImporting}
          style={{
            width: '100%',
            padding: '8px',
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: darkMode ? '1px solid #2a2a4a' : '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        />
        {isImporting && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Importing data...
          </div>
        )}
      </div>

      {/* Clear Data Section */}
      <div style={{
        padding: '16px',
        background: darkMode ? '#16162a' : '#fef2f2',
        borderRadius: '8px',
        marginBottom: '16px',
        border: darkMode ? '1px solid #dc2626' : '1px solid #fecaca'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
          Clear Data
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Remove all order history, held orders, and temporary data. Settings and customers will be preserved.
        </div>
        <button
          onClick={handleClearData}
          style={{
            padding: '10px 20px',
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Clear Temporary Data
        </button>
      </div>

      {/* Warning */}
      <div style={{
        padding: '12px',
        background: darkMode ? '#1a2a1a' : '#fef3c7',
        borderRadius: '4px',
        border: darkMode ? '1px solid #059669' : '1px solid #fcd34d'
      }}>
        <div style={{ fontSize: '12px', color: darkMode ? '#6ee7b7' : '#92400e' }}>
          ⚠️ Always create a backup before importing data or clearing storage. Data operations cannot be undone.
        </div>
      </div>
    </div>
  );
}

export default DataManagementPanel;
