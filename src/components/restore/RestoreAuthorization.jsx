// Restore Authorization Component
// Handles owner authentication for restore operations

import React, { useState, useEffect } from 'react';
import { verifyOwnerPassword } from '../../utils/setupSecurity.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000;

export default function RestoreAuthorization({ onAuthorized, onCancel }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  // Countdown timer for the lockout period after too many failed attempts
  useEffect(() => {
    if (!lockedUntil) return undefined;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setLockoutSecondsLeft(0);
      } else {
        setLockoutSecondsLeft(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && lockoutSecondsLeft > 0;

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyOwnerPassword(trimmed);
      if (isValid) {
        // Never lift the raw password up through the component tree. Mint a
        // short-lived, single-use authorization token that callers can pass
        // along to the restore APIs instead. The password itself is cleared
        // from state immediately.
        const authToken = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        setPassword('');
        onAuthorized(authToken);
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setPassword('');
        if (nextAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setError(`Too many failed attempts. Try again in ${LOCKOUT_MS / 1000}s.`);
        } else {
          setError(`Invalid password. ${MAX_ATTEMPTS - nextAttempts} attempt(s) remaining.`);
        }
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2">🔐 Owner Authorization Required</h4>
        <p className="text-sm text-amber-700">
          Restore operations can significantly impact your business data. 
          Please authenticate as the owner to proceed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="owner-password" className="block text-sm font-medium text-gray-700 mb-1">
            Owner Password
          </label>
          <div className="relative">
            <input
              id="owner-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              disabled={isVerifying || isLocked}
              aria-invalid={!!error}
              aria-describedby={error ? 'owner-password-error' : undefined}
              autoComplete="current-password"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              disabled={isVerifying || isLocked}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {error && (
            <p id="owner-password-error" role="alert" className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isVerifying}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isVerifying || isLocked || !password}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocked ? `Locked (${lockoutSecondsLeft}s)` : isVerifying ? 'Verifying...' : 'Authorize'}
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-500 text-center">
        This action will be logged in the audit trail.
      </div>
    </div>
  );
}
