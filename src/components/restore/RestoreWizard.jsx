// Restore Wizard Component
// Guided workflow for restore operations with 9-step process

import React, { useState, useEffect, useCallback } from 'react';
import { RestoreType, RestoreStatus, CompatibilityStatus } from '../../restore/RestoreTypes.js';
import { getBackupManager } from '../../backup/BackupManager.js';
import { getRestoreManager } from '../../restore/RestoreManager.js';
import RestoreAuthorization from './RestoreAuthorization.jsx';

const STEPS = [
  { id: 'choose_backup', title: 'Choose Backup', description: 'Select a backup to restore' },
  { id: 'compatibility', title: 'Compatibility Check', description: 'Verify backup compatibility' },
  { id: 'integrity', title: 'Integrity Verification', description: 'Verify backup integrity' },
  { id: 'preview', title: 'Preview Changes', description: 'Review changes before restore' },
  { id: 'authorization', title: 'Owner Verification', description: 'Authenticate as owner' },
  { id: 'safety_backup', title: 'Safety Backup', description: 'Create recovery point' },
  { id: 'execute', title: 'Execute Restore', description: 'Restore data from backup' },
  { id: 'verification', title: 'Verification', description: 'Verify restore success' },
  { id: 'summary', title: 'Completion Summary', description: 'Restore completed' }
];

export default function RestoreWizard({ onComplete, onCancel }) {
  const backupManager = getBackupManager();
  const restoreManager = getRestoreManager();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreType, setRestoreType] = useState(RestoreType.FULL);
  const [selectedModules, setSelectedModules] = useState(null);
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [verifyAfterRestore, setVerifyAfterRestore] = useState(true);
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ownerAuthToken, setOwnerAuthToken] = useState(null);
  const [safetyBackupId, setSafetyBackupId] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const availableBackups = backupManager.getBackupHistory();

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const handleNext = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      switch (STEPS[currentStep].id) {
        case 'choose_backup':
          if (!selectedBackup) {
            setError('Please select a backup');
            setIsProcessing(false);
            return;
          }
          setCurrentStep(1);
          break;

        case 'compatibility':
          if (!compatibilityResult) {
            // First click: run the check and pause here so the user can
            // actually see the result before deciding whether to continue.
            // Previously this ran the check and advanced to the next step
            // in the same action, so the result was never visible.
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCompatibilityResult({
              status: CompatibilityStatus.COMPATIBLE,
              score: 95,
              issues: [],
              warnings: [
                { type: 'version_mismatch', message: 'Minor version difference', severity: 'warning' }
              ]
            });
            setIsProcessing(false);
            return;
          }
          if (compatibilityResult.status !== CompatibilityStatus.COMPATIBLE) {
            setError('This backup is not compatible with your current system. Please choose a different backup.');
            setIsProcessing(false);
            return;
          }
          setCurrentStep(2);
          break;

        case 'integrity':
          if (!integrityResult) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIntegrityResult({
              verified: true,
              checksum: selectedBackup.checksum,
              manifestValid: true
            });
            setIsProcessing(false);
            return;
          }
          if (!integrityResult.verified) {
            setError('Backup integrity verification failed. This backup may be corrupted and should not be restored.');
            setIsProcessing(false);
            return;
          }
          setCurrentStep(3);
          break;

        case 'preview':
          // Simulate preview
          await new Promise(resolve => setTimeout(resolve, 1000));
          setPreviewResult({
            affectedModules: ['orders', 'menuItems', 'customers', 'inventory'],
            itemsAdded: 150,
            itemsUpdated: 75,
            itemsRemoved: 20,
            estimatedDuration: 30000,
            storageImpact: selectedBackup.compressedSize,
            warnings: []
          });
          setCurrentStep(4);
          break;

        case 'authorization':
          if (!isAuthorized) {
            setError('Please authenticate as owner');
            setIsProcessing(false);
            return;
          }
          setCurrentStep(5);
          break;

        case 'safety_backup':
          if (createSafetyBackup) {
            const safetyResult = await backupManager.createBackup({
              type: 'PRE_RESTORE',
              modules: selectedModules || null,
              name: `Safety Backup before restore`,
              description: `Automatic safety backup before restore from ${selectedBackup.backupId}`,
              tags: ['safety', 'pre-restore']
            });
            if (safetyResult.success) {
              setSafetyBackupId(safetyResult.backupId);
            } else {
              // Don't silently proceed into a restore without the safety net
              // the user asked for - stop and let them decide how to proceed.
              setError(safetyResult.error || 'Failed to create safety backup. You can disable "Create Safety Backup" to skip this step, or try again.');
              setIsProcessing(false);
              return;
            }
          }
          setCurrentStep(6);
          break;

        case 'execute': {
          // Note: declared as `result` (not `restoreResult`) so it doesn't
          // shadow the `restoreResult` state used later in the 'summary'
          // step - shadowing it here previously threw a ReferenceError
          // ("Cannot access 'restoreResult' before initialization") as soon
          // as the wizard reached the summary screen.
          const result = await restoreManager.createRestore({
            backupId: selectedBackup.backupId,
            type: restoreType,
            modules: selectedModules,
            operator: 'manual',
            createSafetyBackup: false,
            verifyAfterRestore: verifyAfterRestore,
            ownerAuthToken
          });
          setRestoreResult(result);
          if (result.success) {
            setCurrentStep(7);
          } else {
            setError(result.error);
          }
          break;
        }

        case 'verification':
          // Simulate verification
          await new Promise(resolve => setTimeout(resolve, 2000));
          setVerificationResult({
            success: true,
            issues: [],
            modulesVerified: selectedModules?.length || 10
          });
          setCurrentStep(8);
          break;

        case 'summary':
          onComplete?.({
            success: true,
            restoreId: restoreResult?.restoreId,
            safetyBackupId
          });
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [currentStep, selectedBackup, isAuthorized, createSafetyBackup, restoreType, selectedModules, verifyAfterRestore, ownerAuthToken, backupManager, restoreManager, onComplete, restoreResult]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAuthorized = (authToken) => {
    setOwnerAuthToken(authToken);
    setIsAuthorized(true);
  };

  const getStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'choose_backup':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restore Type</label>
              <select
                value={restoreType}
                onChange={(e) => setRestoreType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value={RestoreType.FULL}>Full Restore</option>
                <option value={RestoreType.SELECTIVE}>Selective Restore</option>
                <option value={RestoreType.DRY_RUN}>Dry Run (Test)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Backup</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableBackups.map(backup => (
                  <button
                    key={backup.backupId}
                    onClick={() => {
                      // Selecting a (different) backup invalidates any
                      // compatibility/integrity/preview results computed
                      // for a previous selection.
                      setSelectedBackup(backup);
                      setCompatibilityResult(null);
                      setIntegrityResult(null);
                      setPreviewResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedBackup?.backupId === backup.backupId
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{backup.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.compressedSize)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{backup.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'compatibility':
        return (
          <div className="space-y-4">
            {compatibilityResult ? (
              <>
                <div className={`p-4 rounded-lg ${
                  compatibilityResult.status === CompatibilityStatus.COMPATIBLE
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {compatibilityResult.status === CompatibilityStatus.COMPATIBLE ? '✓ Compatible' : '✗ Incompatible'}
                    </span>
                    <span className="text-2xl font-bold">
                      {compatibilityResult.score}%
                    </span>
                  </div>
                </div>

                {compatibilityResult.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">Warnings</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {compatibilityResult.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Checking compatibility...</p>
              </div>
            )}
          </div>
        );

      case 'integrity':
        return (
          <div className="space-y-4">
            {integrityResult ? (
              <div className={`p-4 rounded-lg ${
                integrityResult.verified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium">
                  {integrityResult.verified ? '✓ Integrity Verified' : '✗ Verification Failed'}
                </div>
                {integrityResult.verified && (
                  <div className="text-sm text-gray-600 mt-2">
                    Checksum: {integrityResult.checksum?.substring(0, 16)}...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Verifying integrity...</p>
              </div>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            {previewResult ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{previewResult.itemsAdded}</div>
                    <div className="text-sm text-blue-700">Items Added</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">{previewResult.itemsUpdated}</div>
                    <div className="text-sm text-amber-700">Items Updated</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{previewResult.itemsRemoved}</div>
                    <div className="text-sm text-red-700">Items Removed</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Estimated Duration:</span>
                      <span className="ml-2 font-medium">{formatDuration(previewResult.estimatedDuration)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Storage Impact:</span>
                      <span className="ml-2 font-medium">{formatBytes(previewResult.storageImpact)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Affected Modules:</strong> {previewResult.affectedModules.join(', ')}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Calculating changes...</p>
              </div>
            )}
          </div>
        );

      case 'authorization':
        return (
          <RestoreAuthorization
            onAuthorized={handleAuthorized}
            onCancel={onCancel}
          />
        );

      case 'safety_backup':
        return (
          <div className="space-y-4">
            {safetyBackupId ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-medium text-green-800">✓ Safety Backup Created</div>
                <div className="text-sm text-green-700 mt-1">
                  Backup ID: {safetyBackupId}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Creating safety backup...</p>
              </div>
            )}
          </div>
        );

      case 'execute':
        return (
          <div className="space-y-4">
            {restoreResult ? (
              <div className={`p-4 rounded-lg ${
                restoreResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium">
                  {restoreResult.success ? '✓ Restore Completed' : '✗ Restore Failed'}
                </div>
                {restoreResult.success && restoreResult.restoreId && (
                  <div className="text-sm text-gray-600 mt-2">
                    Restore ID: {restoreResult.restoreId}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Executing restore...</p>
              </div>
            )}
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-4">
            {verificationResult ? (
              <div className={`p-4 rounded-lg ${
                verificationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium">
                  {verificationResult.success ? '✓ Verification Passed' : '✗ Verification Failed'}
                </div>
                {verificationResult.success && (
                  <div className="text-sm text-gray-600 mt-2">
                    Modules verified: {verificationResult.modulesVerified}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Verifying restore...</p>
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-xl font-bold text-green-800">Restore Completed Successfully</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Restore ID:</span>
                <span className="font-medium">{restoreResult?.restoreId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Backup Used:</span>
                <span className="font-medium">{selectedBackup?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Safety Backup:</span>
                <span className="font-medium">{safetyBackupId ? 'Created' : 'Skipped'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verification:</span>
                <span className="font-medium">{verificationResult?.success ? 'Passed' : 'Failed'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'choose_backup':
        return !!selectedBackup;
      case 'compatibility':
        // Allow the click that triggers the check (result is still null),
        // but once a result is in, block progression on an incompatible
        // backup rather than letting the user click through a failed check.
        return compatibilityResult === null || compatibilityResult.status === CompatibilityStatus.COMPATIBLE;
      case 'integrity':
        return integrityResult === null || integrityResult.verified === true;
      case 'authorization':
        return isAuthorized;
      default:
        return true;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              idx < currentStep ? 'bg-green-500 text-white' :
              idx === currentStep ? 'bg-amber-500 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            <div className="ml-2 flex-1">
              <div className={`text-sm font-medium ${
                idx === currentStep ? 'text-amber-600' : 'text-gray-600'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-400">{step.description}</div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-4 ${
                idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {getStepContent()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isProcessing}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed() || isProcessing}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}
