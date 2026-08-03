// Export/Import Center Component
// Premium operational workspace for export and import management

import React, { useState, useEffect, useCallback } from 'react';
import { ExportEngine } from '../../export/ExportEngine.js';
import { ImportEngine } from '../../export/ImportEngine.js';
import { getFieldMapper } from '../../export/FieldMapper.js';
import { getValidationEngine } from '../../export/ValidationEngine.js';
import { getConflictDetector } from '../../export/ConflictDetector.js';
import { getHistoryTracker } from '../../export/HistoryTracker.js';
import { getDestinationManager } from '../../export/DestinationManager.js';
import { ExportFormat, ImportFormat, Module, DestinationType, ConflictResolutionAction } from '../../export/ExportTypes.js';

export default function ExportImportCenter() {
  const exportEngine = new ExportEngine();
  const importEngine = new ImportEngine();
  const fieldMapper = getFieldMapper();
  const validationEngine = getValidationEngine();
  const conflictDetector = getConflictDetector();
  const historyTracker = getHistoryTracker();
  const destinationManager = getDestinationManager();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [exportConfig, setExportConfig] = useState({
    module: Module.ORDERS,
    format: ExportFormat.CSV,
    destination: DestinationType.DOWNLOAD,
    compression: false,
    encryption: false
  });
  const [importConfig, setImportConfig] = useState({
    file: null,
    module: Module.CUSTOMERS,
    format: null,
    fieldMapping: {},
    conflictResolution: ConflictResolutionAction.SKIP
  });
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [conflictResult, setConflictResult] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setExportHistory(historyTracker.getExportHistory({ limit: 20 }));
    setImportHistory(historyTracker.getImportHistory({ limit: 20 }));
    setTemplates(fieldMapper.getTemplates());
  }, [historyTracker, fieldMapper]);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportEngine.exportToDestination(
        [],
        exportConfig.destination,
        {
          format: exportConfig.format,
          compression: exportConfig.compression,
          encryption: exportConfig.encryption
        }
      );

      if (result.success) {
        historyTracker.recordExport({
          module: exportConfig.module,
          format: exportConfig.format,
          destination: exportConfig.destination,
          recordCount: 0,
          size: result.size,
          duration: 0,
          operator: 'current_user',
          filename: result.filename,
          compression: exportConfig.compression,
          encryption: exportConfig.encryption
        });
        refreshData();
      }

      return result;
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  }, [exportEngine, exportConfig, historyTracker, refreshData]);

  const handleImportStep = useCallback(async (step) => {
    switch (step) {
      case 2: // Detect format
        if (importConfig.file) {
          const detection = await importEngine.detectFormat(importConfig.file);
          setImportConfig(prev => ({ ...prev, format: detection.format }));
          setImportStep(3);
        }
        break;

      case 3: // Parse file
        if (importConfig.file && importConfig.format) {
          const parsed = await importEngine.parseFile(importConfig.file, importConfig.format);
          setImportData(parsed);
          setImportStep(4);
        }
        break;

      case 4: // Validate
        if (importData && importData.data) {
          const validation = validationEngine.validate(importData.data, importConfig.module);
          setValidationResult(validation);
          if (validation.valid) {
            setImportStep(5);
          }
        }
        break;

      case 5: // Map fields
        setImportStep(6);
        break;

      case 6: // Detect conflicts
        if (importData && importData.data) {
          const conflicts = conflictDetector.detectConflicts(importData.data, importConfig.module, []);
          setConflictResult(conflicts);
          setImportStep(7);
        }
        break;

      case 7: // Summary
        setImportStep(8);
        break;

      case 8: // Import
        if (importData && importData.data) {
          const result = await importEngine.import(importData.data, {
            fieldMapping: importConfig.fieldMapping,
            conflictResolution: importConfig.conflictResolution
          });

          historyTracker.recordImport({
            module: importConfig.module,
            format: importConfig.format,
            source: importConfig.file?.name,
            recordsImported: result.imported,
            recordsSkipped: result.skipped,
            recordsFailed: result.failed,
            duration: 0,
            operator: 'current_user',
            filename: importConfig.file?.name
          });

          refreshData();
          setImportStep(9);
        }
        break;

      default:
        setImportStep(step);
    }
  }, [importConfig, importData, importEngine, validationEngine, conflictDetector, historyTracker, refreshData]);

  const handleSaveTemplate = useCallback((name) => {
    fieldMapper.saveTemplate(name, importConfig.module, importConfig.fieldMapping);
    refreshData();
  }, [fieldMapper, importConfig, refreshData]);

  const handleLoadTemplate = useCallback((template) => {
    setImportConfig(prev => ({
      ...prev,
      fieldMapping: template.mappings
    }));
  }, []);

  const filteredExportHistory = exportHistory.filter(record =>
    record.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredImportHistory = importHistory.filter(record =>
    record.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export & Import Center</h1>
          <p className="text-gray-600 mt-1">Universal data exchange platform</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'export', label: 'Export' },
            { id: 'import', label: 'Import' },
            { id: 'history', label: 'History' },
            { id: 'templates', label: 'Templates' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Exports</div>
              <div className="text-2xl font-bold text-gray-900">{exportHistory.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Imports</div>
              <div className="text-2xl font-bold text-gray-900">{importHistory.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Templates</div>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Destinations</div>
              <div className="text-2xl font-bold text-gray-900">
                {destinationManager.getDestinations().length}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {historyTracker.getCombinedHistory({ limit: 5 }).map((record, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">
                      {record.type === 'export' ? 'Export' : 'Import'} - {record.module}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    record.status === 'completed' ? 'bg-green-100 text-green-800' :
                    record.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                <select
                  value={exportConfig.module}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, module: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.values(Module).map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.values(ExportFormat).map(format => (
                    <option key={format} value={format}>{format.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <select
                  value={exportConfig.destination}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {destinationManager.getDestinations().map(dest => (
                    <option key={dest.id} value={dest.id}>{dest.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.compression}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, compression: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Compression</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.encryption}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Encryption</span>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleExport}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Wizard</h3>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[
                'Select File',
                'Detect Format',
                'Preview',
                'Validate',
                'Map Fields',
                'Conflicts',
                'Summary',
                'Import',
                'Results'
              ].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 === importStep ? 'bg-amber-600 text-white' :
                    index + 1 < importStep ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1 < importStep ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    index + 1 === importStep ? 'text-amber-600 font-medium' :
                    index + 1 < importStep ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {step}
                  </span>
                  {index < 8 && <div className="w-16 h-0.5 bg-gray-200 mx-2"></div>}
                </div>
              ))}
            </div>

            {/* Step 1: Select File */}
            {importStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => setImportConfig(prev => ({ ...prev, file: e.target.files[0] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Module</label>
                  <select
                    value={importConfig.module}
                    onChange={(e) => setImportConfig(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.values(Module).map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleImportStep(2)}
                  disabled={!importConfig.file}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: Detect Format */}
            {importStep === 2 && (
              <div className="space-y-4">
                <p className="text-gray-600">Detecting file format...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            )}

            {/* Step 3: Preview */}
            {importStep === 3 && importData && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                  <div className="text-sm text-gray-600">
                    <div>Format: {importConfig.format?.toUpperCase()}</div>
                    <div>Records: {importData.recordCount}</div>
                    <div>Headers: {importData.headers?.join(', ')}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleImportStep(4)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 4: Validate */}
            {importStep === 4 && (
              <div className="space-y-4">
                <p className="text-gray-600">Validating data...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            )}

            {/* Step 5: Validation Results */}
            {importStep === 5 && validationResult && (
              <div className="space-y-4">
                {validationResult.valid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium">Validation Passed</div>
                    <div className="text-sm text-green-600 mt-1">
                      {validationResult.recordCount} records validated successfully
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-medium">Validation Failed</div>
                    <div className="text-sm text-red-600 mt-1">
                      {validationResult.errorCount} errors found
                    </div>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-700 py-1">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleImportStep(6)}
                  disabled={!validationResult.valid}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 6: Map Fields */}
            {importStep === 6 && importData && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Field Mapping</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Map source fields to target fields
                  </p>
                  
                  {importData.headers?.map((header, index) => (
                    <div key={index} className="flex items-center gap-2 py-2">
                      <span className="w-40 text-sm text-gray-700">{header}</span>
                      <span className="text-gray-400">→</span>
                      <input
                        type="text"
                        placeholder="Target field"
                        value={importConfig.fieldMapping[header] || ''}
                        onChange={(e) => setImportConfig(prev => ({
                          ...prev,
                          fieldMapping: { ...prev.fieldMapping, [header]: e.target.value }
                        }))}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleImportStep(7)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 7: Detect Conflicts */}
            {importStep === 7 && (
              <div className="space-y-4">
                <p className="text-gray-600">Detecting conflicts...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            )}

            {/* Step 8: Conflict Results */}
            {importStep === 8 && conflictResult && (
              <div className="space-y-4">
                {conflictResult.hasConflicts ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-amber-800 font-medium">
                      {conflictResult.conflictCount} Conflicts Detected
                    </div>
                    <div className="text-sm text-amber-600 mt-1">
                      Please review and resolve conflicts before importing
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium">No Conflicts</div>
                    <div className="text-sm text-green-600 mt-1">
                      Ready to import
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conflict Resolution</label>
                  <select
                    value={importConfig.conflictResolution}
                    onChange={(e) => setImportConfig(prev => ({ ...prev, conflictResolution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.values(ConflictResolutionAction).map(action => (
                      <option key={action} value={action}>{action.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleImportStep(9)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Import
                </button>
              </div>
            )}

            {/* Step 9: Results */}
            {importStep === 9 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-800 font-medium">Import Completed</div>
                  <div className="text-sm text-green-600 mt-1">
                    Data has been imported successfully
                  </div>
                </div>

                <button
                  onClick={() => {
                    setImportStep(1);
                    setImportConfig({
                      file: null,
                      module: Module.CUSTOMERS,
                      format: null,
                      fieldMapping: {},
                      conflictResolution: ConflictResolutionAction.SKIP
                    });
                    setImportData(null);
                    setValidationResult(null);
                    setConflictResult(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Start New Import
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Export History</h3>
              {filteredExportHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No export history</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredExportHistory.map((record, index) => (
                    <div key={index} className="p-3 border border-gray-100 rounded-lg">
                      <div className="font-medium text-gray-900">{record.module}</div>
                      <div className="text-sm text-gray-500">
                        {record.format.toUpperCase()} • {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {record.recordCount} records • {(record.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Import History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Import History</h3>
              {filteredImportHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No import history</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredImportHistory.map((record, index) => (
                    <div key={index} className="p-3 border border-gray-100 rounded-lg">
                      <div className="font-medium text-gray-900">{record.module}</div>
                      <div className="text-sm text-gray-500">
                        {record.format?.toUpperCase()} • {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {record.recordsImported} imported • {record.recordsSkipped} skipped
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Field Mapping Templates</h3>
            {filteredTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No templates saved</div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template, index) => (
                  <div key={index} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="px-3 py-1 text-sm border border-amber-300 text-amber-600 rounded hover:bg-amber-50"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
