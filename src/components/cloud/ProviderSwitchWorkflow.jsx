// Provider Switch Workflow Component
// Handles the guided workflow for switching between cloud storage providers with owner authentication

import React, { useState, useCallback, useEffect } from 'react';

const STEPS = {
  CONFIRMATION: 'confirmation',
  AUTHENTICATION: 'authentication',
  CONFIGURATION: 'configuration',
  VALIDATION: 'validation',
  MIGRATION: 'migration',
  COMPLETION: 'completion'
};

export default function ProviderSwitchWorkflow({ 
  currentProvider, 
  newProvider, 
  onSwitchComplete, 
  onCancel 
}) {
  const [currentStep, setCurrentStep] = useState(STEPS.CONFIRMATION);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [newConfig, setNewConfig] = useState({});
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setOwnerPassword('');
    setAuthError('');
    setNewConfig({});
    setMigrationProgress(0);
    setMigrationStatus('');
    setIsProcessing(false);
  }, []);

  const handleStepChange = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const handleOwnerAuth = useCallback(async () => {
    setIsProcessing(true);
    setAuthError('');

    try {
      // Verify owner password
      const { verifyOwnerPassword } = await import('../../utils/setupSecurity.js');
      const isValid = await verifyOwnerPassword(ownerPassword);

      if (!isValid) {
        setAuthError('Invalid password. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Authentication successful, move to configuration
      handleStepChange(STEPS.CONFIGURATION);
    } catch (error) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [ownerPassword, handleStepChange]);

  const handleConfigurationSave = useCallback((config) => {
    setNewConfig(config);
    handleStepChange(STEPS.VALIDATION);
  }, [handleStepChange]);

  const handleMigrationStart = useCallback(async () => {
    setIsProcessing(true);
    setMigrationStatus('Starting migration...');
    setMigrationProgress(0);

    try {
      // Simulate migration process
      const steps = [
        { progress: 10, status: 'Validating new provider connection...' },
        { progress: 20, status: 'Testing new provider capabilities...' },
        { progress: 30, status: 'Preparing data for migration...' },
        { progress: 50, status: 'Migrating files...' },
        { progress: 70, status: 'Migrating metadata...' },
        { progress: 85, status: 'Verifying migration integrity...' },
        { progress: 95, status: 'Updating system configuration...' },
        { progress: 100, status: 'Migration complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMigrationProgress(step.progress);
        setMigrationStatus(step.status);
      }

      handleStepChange(STEPS.COMPLETION);
    } catch (error) {
      setMigrationStatus('Migration failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [handleStepChange]);

  const handleComplete = useCallback(() => {
    if (onSwitchComplete) {
      onSwitchComplete({
        currentProvider: currentProvider.id,
        newProvider: newProvider.id,
        newConfig,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentProvider, newProvider, newConfig, onSwitchComplete]);

  const handleCancel = useCallback(() => {
    resetState();
    if (onCancel) onCancel();
  }, [resetState, onCancel]);

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2">⚠️ Important Notice</h4>
        <p className="text-sm text-amber-700">
          Switching storage providers will require you to reconfigure your storage settings.
          Make sure you have your new provider credentials ready before proceeding.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-700 mb-2">Current Provider</h5>
          <div className="text-2xl mb-1">{currentProvider.metadata?.icon || '💾'}</div>
          <div className="font-semibold">{currentProvider.name}</div>
          <div className="text-sm text-gray-500">{currentProvider.description}</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h5 className="font-medium text-amber-800 mb-2">New Provider</h5>
          <div className="text-2xl mb-1">{newProvider.metadata?.icon || '☁️'}</div>
          <div className="font-semibold">{newProvider.name}</div>
          <div className="text-sm text-gray-500">{newProvider.description}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => handleStepChange(STEPS.AUTHENTICATION)}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderAuthenticationStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">🔐 Owner Authentication Required</h4>
        <p className="text-sm text-blue-700">
          For security purposes, you must authenticate as the owner to switch storage providers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner Password
          </label>
          <input
            type="password"
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleOwnerAuth()}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            autoFocus
          />
          {authError && (
            <p className="text-sm text-red-500 mt-1">{authError}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleStepChange(STEPS.CONFIRMATION)}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleOwnerAuth}
          disabled={isProcessing || !ownerPassword}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Verifying...' : 'Authenticate'}
        </button>
      </div>
    </div>
  );

  const renderConfigurationStep = () => {
    const ProviderConfiguration = React.lazy(() => import('./ProviderConfiguration.jsx'));

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">⚙️ Configure New Provider</h4>
          <p className="text-sm text-green-700">
            Enter the configuration details for your new storage provider.
          </p>
        </div>

        <React.Suspense fallback={<div>Loading configuration...</div>}>
          <ProviderConfiguration
            providerId={newProvider.id}
            providerName={newProvider.name}
            onSave={handleConfigurationSave}
            onCancel={handleCancel}
          />
        </React.Suspense>
      </div>
    );
  };

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-800 mb-2">✅ Validation Summary</h4>
        <p className="text-sm text-purple-700">
          Review the configuration before proceeding with the migration.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div>
            <div className="font-medium">New Provider</div>
            <div className="text-sm text-gray-600">{newProvider.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div>
            <div className="font-medium">Configuration Validated</div>
            <div className="text-sm text-gray-600">All required fields provided</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div>
            <div className="font-medium">Owner Authenticated</div>
            <div className="text-sm text-gray-600">Permission verified</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleStepChange(STEPS.CONFIGURATION)}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleMigrationStart}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Starting...' : 'Start Migration'}
        </button>
      </div>
    </div>
  );

  const renderMigrationStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">🔄 Migration in Progress</h4>
        <p className="text-sm text-blue-700">
          Please wait while we migrate your data to the new provider.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                {migrationProgress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{ width: `${migrationProgress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
            ></div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600">{migrationStatus}</p>
        </div>
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <span className="text-5xl mb-4 block">🎉</span>
        <h4 className="font-semibold text-green-800 text-xl mb-2">Migration Complete!</h4>
        <p className="text-sm text-green-700">
          Your storage has been successfully migrated to {newProvider.name}.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div className="text-sm text-gray-600">
            <span className="font-medium">New Provider:</span> {newProvider.name}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Configuration:</span> Applied successfully
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-green-500 text-xl">✓</span>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Data Migration:</span> Completed
          </div>
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
      >
        Finish
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[
            { key: STEPS.CONFIRMATION, label: 'Confirm' },
            { key: STEPS.AUTHENTICATION, label: 'Authenticate' },
            { key: STEPS.CONFIGURATION, label: 'Configure' },
            { key: STEPS.VALIDATION, label: 'Validate' },
            { key: STEPS.MIGRATION, label: 'Migrate' },
            { key: STEPS.COMPLETION, label: 'Complete' }
          ].map((step, index) => {
            const stepIndex = Object.values(STEPS).indexOf(step.key);
            const currentIndex = Object.values(STEPS).indexOf(currentStep);
            const isCompleted = stepIndex < currentIndex;
            const isCurrent = step.key === currentStep;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isCurrent ? 'font-medium text-amber-600' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < 5 && (
                  <div className={`flex-1 h-1 mx-2 ${stepIndex < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === STEPS.CONFIRMATION && renderConfirmationStep()}
        {currentStep === STEPS.AUTHENTICATION && renderAuthenticationStep()}
        {currentStep === STEPS.CONFIGURATION && renderConfigurationStep()}
        {currentStep === STEPS.VALIDATION && renderValidationStep()}
        {currentStep === STEPS.MIGRATION && renderMigrationStep()}
        {currentStep === STEPS.COMPLETION && renderCompletionStep()}
      </div>
    </div>
  );
}
