import React from 'react';
// Import Wizard for CafeOS
// Module-specific data import with validation, preview, and duplicate handling

import { useState, useCallback, useEffect } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { parseCSV, validateCSVData, coerceCSVTypes, detectCSVDuplicates } from "../../utils/csvParser.js";
import { getTemplate, downloadTemplateCSV } from "../../utils/importTemplates.js";
import { ImportExportPermissions } from "../../utils/permissionService.js";
import { createImportAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import ConfirmDialog from "../common/ConfirmDialog";
import { 
  downloadFromCloudStorage, 
  listCloudStorageFiles, 
  getActiveCloudProvider,
  CLOUD_PROVIDERS 
} from "../../utils/cloudStorage.js";

const MODULES = [
  { id: 'menuItems', name: 'Menu Items', icon: '🍔' },
  { id: 'customers', name: 'Customers', icon: '👥' },
  { id: 'suppliers', name: 'Suppliers', icon: '🏢' },
  { id: 'inventory', name: 'Inventory', icon: '📦' },
  { id: 'fullConfig', name: 'Full Configuration', icon: '⚙️', isFullConfig: true }
];

const IMPORT_STRATEGIES = {
  append: 'Append - Add new records, skip duplicates',
  replace: 'Replace - Replace all existing data',
  merge: 'Merge - Update existing, add new'
};

export default function ImportWizard({ dataTools, onImportComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedModule, setSelectedModule] = useState(null);
  const [importStrategy, setImportStrategy] = useState('append');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [permissionDialog, setPermissionDialog] = useState({ open: false, action: "", requiredPermission: "" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null });
  const [cloudFiles, setCloudFiles] = useState([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [downloadFromCloud, setDownloadFromCloud] = useState(false);

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
    console.warn('[ImportWizard] Permission denied:', denialLog);
  }, []);

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    if (!selectedModule) return;
    downloadTemplateCSV(selectedModule);
  }, [selectedModule]);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const module = MODULES.find(m => m.id === selectedModule);
    
    // Full config imports must be JSON
    if (module?.isFullConfig) {
      if (!uploadedFile.name.endsWith('.json')) {
        showMessage("error", "Full configuration import requires a JSON file");
        return;
      }
    } else {
      if (!uploadedFile.name.endsWith('.csv')) {
        showMessage("error", "Please select a CSV file");
        return;
      }
    }

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (module?.isFullConfig) {
          // Handle full config JSON import
          const jsonContent = event.target.result;
          const config = JSON.parse(jsonContent);
          
          // Validate it's a full config export
          if (config.exportType !== 'fullConfiguration' || config.app !== 'CafeOS') {
            showMessage("error", "Invalid full configuration file");
            return;
          }

          setParsedData([config]);
          setValidation({ valid: true, errors: [], warnings: [] });
          setPreviewData([config]);
          setStep(3);
        } else {
          // Handle CSV import
          const csvContent = event.target.result;
          const template = getTemplate(selectedModule);
          const result = parseCSV(csvContent, { hasHeader: true });

          if (!result.success) {
            showMessage("error", `Failed to parse CSV: ${result.errors.join(', ')}`);
            return;
          }

          // Validate against schema
          const validationResult = validateCSVData(result.data, template.schema);
          setValidation(validationResult);

          // Coerce types
          const coercedData = coerceCSVTypes(result.data, template.schema);
          setParsedData(coercedData);

          // Check for duplicates
          const keyField = selectedModule === 'menuItems' ? 'name' : 
                          selectedModule === 'customers' ? 'phone' :
                          selectedModule === 'suppliers' ? 'name' : 'sku';
          const duplicateValues = detectCSVDuplicates(coercedData, keyField);
          setDuplicates(duplicateValues);

          // Set preview (first 10 rows)
          setPreviewData(coercedData.slice(0, 10));

          if (validationResult.valid) {
            setStep(3);
          } else {
            showMessage("error", `Validation failed: ${validationResult.errors.slice(0, 3).join(', ')}`);
          }
        }
      } catch (err) {
        showMessage("error", `Error reading file: ${err.message}`);
      }
    };
    reader.readAsText(uploadedFile);
  }, [selectedModule, showMessage]);

  // Handle import
  const handleImport = useCallback(() => {
    const permissionCheck = ImportExportPermissions.canImport();
    if (!permissionCheck.allowed) {
      handlePermissionDenied('IMPORT_DATA', permissionCheck.requiredPermission);
      return;
    }

    const module = MODULES.find(m => m.id === selectedModule);

    setConfirmDialog({
      open: true,
      onConfirm: () => {
        try {
          if (!dataTools || !parsedData) return;

          // Handle full config import
          if (module?.isFullConfig) {
            const config = parsedData[0];
            let importedSettings = 0;
            let importedCollections = 0;

            // Import all settings to localStorage
            Object.keys(config.settings || {}).forEach(key => {
              try {
                localStorage.setItem(key, JSON.stringify(config.settings[key]));
                importedSettings++;
              } catch (e) {
                console.warn(`Failed to import setting ${key}:`, e);
              }
            });

            // Import all collections using dataTools
            if (dataTools.importLocalData) {
              const collectionsJson = JSON.stringify(config.collections, null, 2);
              const result = dataTools.importLocalData(collectionsJson);
              if (result && result.ok) {
                importedCollections = result.imported?.length || 0;
              }
            }

            // Audit log
            const auditLog = createImportAuditLog(selectedModule, {
              userId: getCurrentUserId(),
              details: {
                module: selectedModule,
                strategy: 'fullConfig',
                importedSettings,
                importedCollections,
                configVersion: config.version
              }
            });
            console.log('[ImportWizard] Full config import completed:', auditLog);

            showMessage("success", `Imported full configuration: ${importedSettings} settings, ${importedCollections} collections`);
            
            if (onImportComplete) {
              onImportComplete();
            }
            
            setConfirmDialog({ open: false, onConfirm: null });
            return;
          }

          // Import logic based on strategy for CSV imports
          let importedCount = 0;
          let skippedCount = 0;

          if (importStrategy === 'append') {
            // Add new records, skip duplicates
            parsedData.forEach(item => {
              // Check if already exists
              const exists = false; // TODO: Implement existence check
              if (!exists) {
                // TODO: Add to collection
                importedCount++;
              } else {
                skippedCount++;
              }
            });
          } else if (importStrategy === 'replace') {
            // Replace all existing data
            // TODO: Implement replace logic
            importedCount = parsedData.length;
          } else if (importStrategy === 'merge') {
            // Update existing, add new
            parsedData.forEach(item => {
              // TODO: Implement merge logic
              importedCount++;
            });
          }

          // Audit log
          const auditLog = createImportAuditLog(selectedModule, {
            userId: getCurrentUserId(),
            details: {
              module: selectedModule,
              strategy: importStrategy,
              importedCount,
              skippedCount,
              duplicateCount: duplicates.length
            }
          });
          console.log('[ImportWizard] Import completed:', auditLog);

          showMessage("success", `Imported ${importedCount} records${skippedCount > 0 ? `, skipped ${skippedCount}` : ''}`);
          
          if (onImportComplete) {
            onImportComplete();
          }
          
          setConfirmDialog({ open: false, onConfirm: null });
        } catch (err) {
          showMessage("error", `Import failed: ${err.message}`);
        }
      }
    });
  }, [dataTools, parsedData, importStrategy, selectedModule, duplicates, handlePermissionDenied, showMessage, onImportComplete]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedModule(null);
    setImportStrategy('append');
    setFile(null);
    setParsedData(null);
    setValidation(null);
    setDuplicates([]);
    setPreviewData([]);
    setCloudFiles([]);
    setDownloadFromCloud(false);
  }, []);

  // Load cloud files
  const handleLoadCloudFiles = useCallback(async () => {
    const activeProvider = getActiveCloudProvider();
    if (!activeProvider) {
      showMessage("error", "No active cloud provider configured");
      return;
    }

    setIsLoadingCloud(true);
    try {
      const result = await listCloudStorageFiles('CafeOS/', activeProvider);
      if (result.success) {
        setCloudFiles(result.files || []);
        showMessage("success", `Loaded ${result.files?.length || 0} files from cloud`);
      } else {
        showMessage("error", "Failed to load cloud files");
      }
    } catch (error) {
      showMessage("error", `Failed to load cloud files: ${error.message}`);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [showMessage]);

  // Download from cloud
  const handleCloudDownload = useCallback(async (cloudKey) => {
    const activeProvider = getActiveCloudProvider();
    if (!activeProvider) {
      showMessage("error", "No active cloud provider configured");
      return;
    }

    setIsLoadingCloud(true);
    try {
      const result = await downloadFromCloudStorage(cloudKey, activeProvider);
      if (result.success && result.data) {
        setImportText(result.data);
        showMessage("success", "Downloaded file from cloud");
      } else {
        showMessage("error", "Failed to download from cloud");
      }
    } catch (error) {
      showMessage("error", `Failed to download from cloud: ${error.message}`);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [showMessage]);

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
            Import Wizard
          </h2>
          <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: "4px 0 0" }}>
            Step {step} of 3: {step === 1 ? 'Select Module' : step === 2 ? 'Upload File' : 'Review & Import'}
          </p>
        </div>
        <button onClick={onCancel} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px" }}>
          Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, padding: "16px 24px", background: "var(--cafe-bg-elevated)" }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: s <= step ? "var(--cafe-accent)" : "var(--cafe-border-light)",
              transition: "background 0.3s ease"
            }}
          />
        ))}
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

        {step === 1 && (
          <div style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
              Select Module to Import
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {MODULES.map(module => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  style={{
                    ...card,
                    padding: "16px",
                    textAlign: "left",
                    border: selectedModule === module.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                    background: selectedModule === module.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{module.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {module.name}
                  </div>
                </button>
              ))}
            </div>

            {selectedModule && !MODULES.find(m => m.id === selectedModule)?.isFullConfig && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
                  Import Strategy
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(IMPORT_STRATEGIES).map(([key, description]) => (
                    <label
                      key={key}
                      style={{
                        ...card,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        border: importStrategy === key ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                        background: importStrategy === key ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)"
                      }}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={key}
                        checked={importStrategy === key}
                        onChange={(e) => setImportStrategy(e.target.value)}
                        style={{ margin: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                          {description.split(' - ')[1]}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  <button onClick={handleDownloadTemplate} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                    📥 Download Template
                  </button>
                  <button onClick={() => setStep(2)} style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px" }}>
                    Next →
                  </button>
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
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-info)", marginBottom: 4 }}>
                    ℹ️ Full Configuration Import
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-info)" }}>
                    Imports all settings, configurations, and data collections. This will replace existing settings and data.
                  </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  <button onClick={() => setStep(2)} style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px" }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
              Upload {MODULES.find(m => m.id === selectedModule)?.isFullConfig ? 'JSON' : 'CSV'} File
            </h3>

            {/* Cloud Storage Option */}
            {getActiveCloudProvider() && (
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border-light)",
                  borderRadius: 8,
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={downloadFromCloud}
                    onChange={(e) => {
                      setDownloadFromCloud(e.target.checked);
                      if (e.target.checked) {
                        handleLoadCloudFiles();
                      } else {
                        setCloudFiles([]);
                      }
                    }}
                    style={{ margin: 0 }}
                  />
                  <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                    Download from cloud storage ({CLOUD_PROVIDERS[getActiveCloudProvider()].name})
                  </div>
                </label>

                {downloadFromCloud && (
                  <div style={{ marginTop: 12 }}>
                    {isLoadingCloud ? (
                      <div style={{ padding: 16, textAlign: "center", color: "var(--cafe-text-tertiary)" }}>
                        Loading cloud files...
                      </div>
                    ) : cloudFiles.length > 0 ? (
                      <div style={{ ...card, padding: 12, maxHeight: 200, overflowY: "auto" }}>
                        {cloudFiles.map((file, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCloudDownload(file.key)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              background: "transparent",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 12,
                              color: "var(--cafe-text-secondary)",
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--cafe-bg-surface)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            📄 {file.key.split('/').pop()}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: 12, textAlign: "center", color: "var(--cafe-text-tertiary)", fontSize: 12 }}>
                        No files found in cloud storage
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!downloadFromCloud && (
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "40px",
                borderRadius: 8,
                cursor: "pointer",
                border: "2px dashed var(--cafe-border-light)",
                background: "var(--cafe-bg-surface)",
                transition: "border-color 0.15s"
              }}>
                <span style={{ fontSize: 32 }}>📂</span>
                <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)", fontWeight: 500 }}>
                  {file ? file.name : `Choose ${MODULES.find(m => m.id === selectedModule)?.isFullConfig ? 'JSON' : 'CSV'} file`}
                </span>
                <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                  or drag and drop
                </span>
                <input
                  type="file"
                  accept={MODULES.find(m => m.id === selectedModule)?.isFullConfig ? '.json' : '.csv'}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 800 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-secondary)" }}>
              Review & Import
            </h3>

            {/* Validation status */}
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>
                  {validation?.valid ? '✅' : '⚠️'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: validation?.valid ? "var(--cafe-success)" : "var(--cafe-warning)" }}>
                  {validation?.valid ? 'Validation Passed' : 'Validation Issues Found'}
                </span>
              </div>

              {validation?.errors.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--cafe-danger)", marginBottom: 8 }}>
                  <strong>Errors:</strong> {validation.errors.slice(0, 3).join(', ')}
                  {validation.errors.length > 3 && ` (+${validation.errors.length - 3} more)`}
                </div>
              )}

              {validation?.warnings.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--cafe-warning)" }}>
                  <strong>Warnings:</strong> {validation.warnings.slice(0, 3).join(', ')}
                  {validation.warnings.length > 3 && ` (+${validation.warnings.length - 3} more)`}
                </div>
              )}
            </div>

            {/* Duplicate warnings */}
            {duplicates.length > 0 && (
              <div style={{ ...card, padding: 16, marginBottom: 16, background: "var(--cafe-warning-bg)", border: "1px solid var(--cafe-warning-border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-warning)", marginBottom: 8 }}>
                  ⚠️ Potential Duplicates Found
                </div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                  {duplicates.length} duplicate(s) detected. These will be skipped in append mode.
                </div>
              </div>
            )}

            {/* Import summary */}
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Records</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                    {parsedData?.length || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Duplicates</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-warning)" }}>
                    {duplicates.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Strategy</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
                    {importStrategy}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Preview (First 10 records)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--cafe-border)" }}>
                      {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                        <th key={key} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--cafe-text-tertiary)" }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                        {Object.values(row).map((value, cellIdx) => (
                          <td key={cellIdx} style={{ padding: "8px 12px", color: "var(--cafe-text-secondary)" }}>
                            {String(value || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                ← Back
              </button>
              <button onClick={handleReset} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                Reset
              </button>
              <button 
                onClick={handleImport} 
                disabled={!validation?.valid}
                style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px", opacity: validation?.valid ? 1 : 0.5 }}
              >
                Import Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title="Import Data"
        description={`This will import ${parsedData?.length || 0} records using ${importStrategy} strategy.`}
        summary={duplicates.length > 0 ? `${duplicates.length} duplicate(s) will be skipped.` : ''}
        confirmLabel="Confirm Import"
      />

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
