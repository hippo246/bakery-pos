import React from 'react';
// Export Center for CafeOS
// Module-specific data export with filters, format options, and preview

import { useState, useCallback, useEffect, useMemo } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { arrayToCSV } from "../../utils/csvParser.js";
import { arrayToCSV as exportToCSV, downloadCSV, generateCSVFilename } from "../../utils/exportUtilities.js";
import { ImportExportPermissions } from "../../utils/permissionService.js";
import { createExportAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import { 
  uploadToCloudStorage, 
  getActiveCloudProvider,
  CLOUD_PROVIDERS 
} from "../../utils/cloudStorage.js";

const MODULES = [
  { id: 'orders', name: 'Orders', icon: '📋', collection: 'orders' },
  { id: 'customers', name: 'Customers', icon: '👥', collection: 'customers' },
  { id: 'menuItems', name: 'Menu Items', icon: '🍔', collection: 'menuItems' },
  { id: 'inventory', name: 'Inventory', icon: '📦', collection: 'inventory' },
  { id: 'staff', name: 'Staff', icon: '👨‍🍳', collection: 'staff' },
  { id: 'suppliers', name: 'Suppliers', icon: '🏢', collection: 'suppliers' },
  { id: 'tables', name: 'Tables', icon: '🪑', collection: 'tables' },
  { id: 'deliveryOrders', name: 'Delivery Orders', icon: '🚚', collection: 'deliveryOrders' },
  { id: 'expenses', name: 'Expenses', icon: '💰', collection: 'expenses' },
  { id: 'fullConfig', name: 'Full Configuration', icon: '⚙️', collection: 'settings', isFullConfig: true }
];

const EXPORT_FORMATS = [
  { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
  { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' }
];

export default function ExportCenter({ dataTools, onCancel }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [permissionDialog, setPermissionDialog] = useState({ open: false, action: "", requiredPermission: "" });
  const [uploadToCloud, setUploadToCloud] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: "" }), 5000);
  }, []);

  const handlePermissionDenied = useCallback((action, requiredPermission) => {
    setPermissionDialog({ open: true, action, requiredPermission });
    const denialLog = createPermissionDeniedAuditLog({
      userId: getCurrentUserId(),
      action,
      details: { requiredPermission }
    });
    console.warn('[ExportCenter] Permission denied:', denialLog);
  }, []);

  // Get module data
  const getModuleData = useCallback((moduleId) => {
    if (!dataTools || !dataTools.getStorageSnapshot) return [];
    
    const snapshot = dataTools.getStorageSnapshot();
    const module = MODULES.find(m => m.id === moduleId);
    if (!module) return [];

    // Handle full configuration export
    if (module.isFullConfig) {
      const fullConfig = {
        app: "CafeOS",
        exportType: "fullConfiguration",
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        settings: {},
        collections: {}
      };

      // Export all settings from localStorage
      const settingsKeys = [
        'brewcrm_settings',
        'cafeos_business_details',
        'cafeos_branch_details',
        'cafeos_operating_hours',
        'cafeos_payment_methods',
        'cafeos_tax_config',
        'cafeos_kitchen_stations',
        'cafeos_tables_config',
        'cafeos_staff_roles',
        'cafeos_menu_categories',
        'cafeos_printer_config',
        'cafeos_remote_assistance',
        'cafeos_integration_settings',
        'cafeos_notification_settings',
        'cafeos_security_settings',
        'cafeos_theme_settings',
        'cafeos_language_settings',
        'cafeos_currency_settings',
        'cafeos_receipt_settings',
        'cafeos_order_settings',
        'cafeos_inventory_settings',
        'cafeos_delivery_settings',
        'cafeos_qr_settings',
        'cafeos_shift_settings',
        'cafeos_reporting_settings',
        'cafeos_api_settings',
        'cafeos_webhook_settings',
        'cafeos_custom_fields',
        'cafeos_workflow_settings'
      ];

      settingsKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            fullConfig.settings[key] = JSON.parse(value);
          }
        } catch (e) {
          console.warn(`Failed to export ${key}:`, e);
        }
      });

      // Export all collections
      Object.keys(snapshot.collections || {}).forEach(key => {
        const collection = snapshot.collections[key];
        if (collection && collection.present !== false) {
          fullConfig.collections[key] = collection;
        }
      });

      return [fullConfig];
    }

    // Get data from snapshot
    const collectionData = snapshot.collections?.[module.collection];
    if (!collectionData) return [];

    // Apply filters
    let filteredData = [];
    if (Array.isArray(collectionData)) {
      filteredData = collectionData.filter(item => {
        // Apply date range filter if set
        if (filters.dateFrom && item.createdAt) {
          const itemDate = new Date(item.createdAt);
          const fromDate = new Date(filters.dateFrom);
          if (itemDate < fromDate) return false;
        }
        if (filters.dateTo && item.createdAt) {
          const itemDate = new Date(item.createdAt);
          const toDate = new Date(filters.dateTo);
          if (itemDate > toDate) return false;
        }
        // Apply status filter if set
        if (filters.status && item.status !== filters.status) return false;
        return true;
      });
    }

    return filteredData;
  }, [dataTools, filters]);

  // Update preview when module or filters change
  useEffect(() => {
    if (!selectedModule) {
      setPreviewData([]);
      setRecordCount(0);
      return;
    }

    const data = getModuleData(selectedModule);
    setRecordCount(data.length);
    setPreviewData(data.slice(0, 10));
  }, [selectedModule, filters, getModuleData]);

  // Handle export
  const handleExport = useCallback(async () => {
    const permissionCheck = ImportExportPermissions.canExport();
    if (!permissionCheck.allowed) {
      handlePermissionDenied('EXPORT_DATA', permissionCheck.requiredPermission);
      return;
    }

    try {
      const data = getModuleData(selectedModule);
      if (data.length === 0) {
        showMessage("error", "No data to export");
        return;
      }

      const module = MODULES.find(m => m.id === selectedModule);
      const timestamp = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString().split('T')[1].split('.')[0];
      const filename = module.isFullConfig 
        ? `CafeOS-FullConfig-${timestamp}-${time}.json`
        : `CafeOS-${module.name}-${timestamp}${selectedFormat === 'csv' ? '.csv' : '.json'}`;

      let content;
      let mimeType;

      // Full config only exports as JSON
      if (module.isFullConfig) {
        content = JSON.stringify(data[0], null, 2);
        mimeType = 'application/json';
      } else if (selectedFormat === 'csv') {
        const headers = Object.keys(data[0]);
        content = arrayToCSV(headers, data);
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Upload to cloud if enabled
      if (uploadToCloud) {
        const activeProvider = getActiveCloudProvider();
        if (activeProvider) {
          setIsUploading(true);
          try {
            const cloudKey = `CafeOS/${module.name}/${filename}`;
            const file = new File([blob], filename, { type: mimeType });
            await uploadToCloudStorage(file, cloudKey);
            showMessage("success", `Exported and uploaded to ${CLOUD_PROVIDERS[activeProvider].name}`);
          } catch (error) {
            showMessage("error", `Exported but cloud upload failed: ${error.message}`);
          } finally {
            setIsUploading(false);
          }
        } else {
          showMessage("warning", "Cloud upload selected but no active provider configured");
        }
      } else {
        showMessage("success", "Export completed successfully");
      }

      // Audit log
      const auditLog = createExportAuditLog(selectedModule, {
        userId: getCurrentUserId(),
        details: {
          module: selectedModule,
          format: module.isFullConfig ? 'json' : selectedFormat,
          recordCount: data.length,
          filename,
          isFullConfig: module.isFullConfig
        }
      });
      console.log('[ExportCenter] Export completed:', auditLog);

      showMessage("success", `Exported ${data.length} records to ${filename}`);
    } catch (err) {
      showMessage("error", `Export failed: ${err.message}`);
    }
  }, [selectedModule, selectedFormat, getModuleData, handlePermissionDenied, showMessage]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--cafe-border)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--cafe-text-primary)" }}>
            Export Center
          </h2>
          <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: "4px 0 0" }}>
            Export module data to CSV or JSON
          </p>
        </div>
        <button onClick={onCancel} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px" }}>
          Close
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {message.text && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 24,
            background: message.type === "error" ? "var(--cafe-danger-bg)" : "var(--cafe-success-bg)",
            border: `1px solid ${message.type === "error" ? "var(--cafe-danger-border)" : "var(--cafe-success-border)"}`,
            color: message.type === "error" ? "var(--cafe-danger)" : "var(--cafe-success)",
            fontSize: 13,
            fontWeight: 500
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left column - Selection */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
              Select Module
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {MODULES.map(module => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  style={{
                    ...card,
                    padding: "12px",
                    textAlign: "left",
                    border: selectedModule === module.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                    background: selectedModule === module.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{module.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {module.name}
                  </div>
                </button>
              ))}
            </div>

            {selectedModule && !MODULES.find(m => m.id === selectedModule)?.isFullConfig && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
                  Export Format
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {EXPORT_FORMATS.map(format => (
                    <label
                      key={format.id}
                      style={{
                        ...card,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        border: selectedFormat === format.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                        background: selectedFormat === format.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)"
                      }}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        style={{ margin: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                          {format.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                          {format.extension}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedModule && MODULES.find(m => m.id === selectedModule)?.isFullConfig && (
              <div style={{ marginTop: 24 }}>
                <div style={{
                  ...card,
                  padding: "12px 16px",
                  background: "var(--cafe-info-bg)",
                  border: "1px solid var(--cafe-info-border)",
                  borderRadius: 8
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-info)", marginBottom: 4 }}>
                    ℹ️ Full Configuration Export
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-info)" }}>
                    Exports all settings, configurations, and data collections. Use this for complete client setup or migration.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Filters & Preview */}
          <div>
            {selectedModule && !MODULES.find(m => m.id === selectedModule)?.isFullConfig && (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
                  Filters
                </h3>
                <div style={{ ...card, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ ...label, marginBottom: 8 }}>Date From</label>
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        style={{ ...input }}
                      />
                    </div>
                    <div>
                      <label style={{ ...label, marginBottom: 8 }}>Date To</label>
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        style={{ ...input }}
                      />
                    </div>
                    {(selectedModule === 'orders' || selectedModule === 'deliveryOrders') && (
                      <div>
                        <label style={{ ...label, marginBottom: 8 }}>Status</label>
                        <select
                          value={filters.status || ''}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          style={{ ...input }}
                        >
                          <option value="">All Statuses</option>
                          <option value="NEW">New</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    )}
                    <button onClick={handleResetFilters} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                      Reset Filters
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
                  {MODULES.find(m => m.id === selectedModule)?.isFullConfig ? 'Configuration Summary' : `Preview (${recordCount} records)`}
                </h3>
                <div style={{ ...card, padding: 16, marginBottom: 16 }}>
                  {MODULES.find(m => m.id === selectedModule)?.isFullConfig ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Export Type</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                            Full Configuration
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Format</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
                            JSON
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Settings Keys</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                            {previewData[0]?.settings ? Object.keys(previewData[0].settings).length : 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Collections</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                            {previewData[0]?.collections ? Object.keys(previewData[0].collections).length : 0}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: 12, background: "var(--cafe-info-bg)", borderRadius: 8, fontSize: 12, color: "var(--cafe-info)" }}>
                        <strong>Includes:</strong> All business settings, branch details, operating hours, payment methods, tax configuration, kitchen stations, tables, staff roles, and all data collections.
                      </div>
                    </div>
                  ) : previewData.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--cafe-border)" }}>
                            {Object.keys(previewData[0]).slice(0, 5).map(key => (
                              <th key={key} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--cafe-text-tertiary)" }}>
                                {key}
                              </th>
                            ))}
                            {Object.keys(previewData[0]).length > 5 && (
                              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--cafe-text-tertiary)" }}>
                                ...
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                              {Object.values(row).slice(0, 5).map((value, cellIdx) => (
                                <td key={cellIdx} style={{ padding: "6px 8px", color: "var(--cafe-text-secondary)" }}>
                                  {String(value || '').substring(0, 20)}
                                </td>
                              ))}
                              {Object.values(row).length > 5 && (
                                <td style={{ padding: "6px 8px", color: "var(--cafe-text-tertiary)" }}>
                                  ...
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--cafe-text-tertiary)" }}>
                      No data to preview
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExport}
                  disabled={recordCount === 0 || isUploading}
                  style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px", width: "100%", opacity: recordCount > 0 && !isUploading ? 1 : 0.5 }}
                >
                  {isUploading ? "Uploading to Cloud..." : `Export ${recordCount} Records`}
                </button>

                {/* Cloud Upload Option */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border-light)",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginTop: 12
                }}>
                  <input
                    type="checkbox"
                    checked={uploadToCloud}
                    onChange={(e) => setUploadToCloud(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                    Also upload to cloud storage
                    {getActiveCloudProvider() && (
                      <span style={{ color: "var(--cafe-success)", marginLeft: 4 }}>
                        ({CLOUD_PROVIDERS[getActiveCloudProvider()].name})
                      </span>
                    )}
                  </div>
                </label>
              </>
            )}

            {!selectedModule && (
              <div style={{ ...card, padding: 24, textAlign: "center", color: "var(--cafe-text-tertiary)" }}>
                <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📊</span>
                Select a module to export
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PermissionDeniedDialog
        open={permissionDialog.open}
        onClose={() => setPermissionDialog({ open: false, action: "", requiredPermission: "" })}
        action={permissionDialog.action}
        requiredPermission={permissionDialog.requiredPermission}
        currentRole="Current"
        contactMessage="Contact your system administrator for access."
      />
    </div>
  );
}
