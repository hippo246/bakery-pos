import React from 'react';
import { useState, useEffect } from "react";
import PermissionDialog from "./PermissionDialog.jsx";
import { requestOverride, validateManagerPin, logActivity } from "../../utils/permissions.js";

// ── Permission Override Hook ─────────────────────────────────────────────
export function usePermissionOverride() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  useEffect(() => {
    const handleRequest = (e) => {
      const { userId, permission, reason, resolve, reject } = e.detail;
      setCurrentRequest({ userId, permission, reason, resolve, reject });
      setDialogOpen(true);
    };

    window.addEventListener('permissionOverrideRequest', handleRequest);
    return () => window.removeEventListener('permissionOverrideRequest', handleRequest);
  }, []);

  const handleApprove = async (pin) => {
    if (!currentRequest) return false;

    const { userId, permission, reason, resolve, reject } = currentRequest;
    
    // Validate PIN (in production, this would check against the manager's PIN)
    const isValid = validateManagerPin(userId, pin);
    
    if (isValid) {
      logActivity('permission_override_granted', { userId, permission, reason });
      resolve(true);
      setDialogOpen(false);
      setCurrentRequest(null);
      return true;
    } else {
      logActivity('permission_override_denied', { userId, permission, reason, reason: 'Invalid PIN' });
      reject(new Error('Invalid PIN'));
      return false;
    }
  };

  const handleClose = () => {
    if (currentRequest) {
      currentRequest.reject(new Error('Cancelled'));
    }
    setDialogOpen(false);
    setCurrentRequest(null);
  };

  const Dialog = () => {
    if (!currentRequest) return null;
    
    return (
      <PermissionDialog
        isOpen={dialogOpen}
        onClose={handleClose}
        onApprove={handleApprove}
        permission={currentRequest.permission}
        currentRole="Cashier"
        reason={currentRequest.reason}
      />
    );
  };

  return { Dialog, requestOverride };
}

// ── Permission Check Wrapper ─────────────────────────────────────────────
export function withPermissionCheck(Component, { moduleId, permissionType, userId }) {
  return function PermissionWrappedComponent(props) {
    const { requestOverride } = usePermissionOverride();
    const [hasPermission, setHasPermission] = useState(true);

    const checkPermission = async () => {
      // In production, this would check the actual permission
      // For now, we'll simulate the check
      const canDo = true; // This would be: hasPermission(userId, moduleId, permissionType)
      
      if (!canDo) {
        try {
          await requestOverride(userId, `${permissionType} ${moduleId}`, "Insufficient permissions");
          setHasPermission(true);
        } catch {
          setHasPermission(false);
        }
      }
    };

    useEffect(() => {
      checkPermission();
    }, []);

    if (!hasPermission) {
      return (
        <div style={{
          padding: 20,
          textAlign: 'center',
          color: 'var(--cafe-text-tertiary)'
        }}>
          Permission denied
        </div>
      );
    }

    return <Component {...props} />;
  };
}
