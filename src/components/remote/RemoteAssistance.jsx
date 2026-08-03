import React from 'react';
// Remote Assistance Component for CafeOS
// RustDesk integration with client authorization and audit logging

import { useState, useCallback, useEffect, useRef } from "react";
import { card, btn } from "../../styles/theme";
import { createRemoteSessionAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import ConfirmDialog from "../common/ConfirmDialog";

const SESSION_STATUS = {
  IDLE: 'idle',
  REQUESTED: 'requested',
  ACTIVE: 'active',
  ENDED: 'ended'
};

// Safety timers: an approval request that nobody acts on, or a connected
// session that nobody remembers to end, shouldn't stay open forever. Both
// are enforced client-side here and logged to the audit trail either way.
const SESSION_REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // auto-cancel an unapproved request
const MAX_SESSION_DURATION_MS = 60 * 60 * 1000; // hard cap on an approved session
const MAX_DURATION_WARNING_LEAD_MS = 5 * 60 * 1000; // heads-up before the cap kicks in

// The visible Session History list and the audit log are two different
// retention limits: history is a small on-screen convenience list, the
// audit log is the actual record. Named here since "9" (kept last 10) was
// previously repeated at four separate call sites with no shared source.
const MAX_HISTORY_ENTRIES = 10;
const MAX_AUDIT_LOG_ENTRIES = 200;

// Session-history entries used Date.now() as their React `key`. Two entries
// created within the same millisecond would collide, which React handles
// by silently reusing/misrendering the list item rather than a clean
// crash - the kind of bug that's easy to miss until it shows up as a
// history entry that won't update. crypto.randomUUID is already the
// pattern this file uses for anything that needs a real unique value
// (see the session code generation below), with the same fallback shape
// for contexts where it's unavailable.
function generateHistoryEntryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Validate RustDesk ID format (numeric ID, typically 9-10 digits)
function validateRustDeskId(id) {
  // RustDesk IDs are numeric, typically 9-10 digits but can vary
  const cleaned = id.replace(/\s/g, '');
  return /^\d{8,12}$/.test(cleaned) ? cleaned : null;
}

export default function RemoteAssistance({ onCancel = () => {}, canManageRemoteAccess = true, currentUserRole }) {
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(SESSION_STATUS.IDLE);
  const [rustDeskId, setRustDeskId] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState({ open: false, action: "", requiredPermission: "" });
  // title/description/confirmLabel travel with the dialog request itself,
  // rather than being inferred from remoteEnabled at render time - that
  // inference was wrong for the "End Session" confirmation, which used to
  // show "Disable Remote Assistance" copy even though it only ends the
  // current session.
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    onConfirm: null,
    title: "",
    description: "",
    confirmLabel: "Confirm"
  });
  const [message, setMessage] = useState({ type: null, text: "" });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);

  // Pending timeouts need to be tracked so they can be cancelled if a new
  // session starts before the old one's cleanup fires, or if the component
  // unmounts before they run (setState-after-unmount).
  const resetTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const iframeTimeoutRef = useRef(null);
  const iframeElRef = useRef(null);
  const requestExpiryTimeoutRef = useRef(null);
  const maxDurationTimeoutRef = useRef(null);
  const maxDurationWarningTimeoutRef = useRef(null);
  const codeCopiedTimeoutRef = useRef(null);
  // Request/Approve each mint a fresh single-use code and arm a new set of
  // safety timers. A rapid double-click (or Enter key repeat) shouldn't be
  // able to fire the handler twice and leave a stray code/timer pair behind.
  const actionInFlightRef = useRef(false);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
      if (iframeElRef.current && iframeElRef.current.parentNode) {
        iframeElRef.current.parentNode.removeChild(iframeElRef.current);
        iframeElRef.current = null;
      }
      if (requestExpiryTimeoutRef.current) clearTimeout(requestExpiryTimeoutRef.current);
      if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
      if (maxDurationWarningTimeoutRef.current) clearTimeout(maxDurationWarningTimeoutRef.current);
      if (codeCopiedTimeoutRef.current) clearTimeout(codeCopiedTimeoutRef.current);
    };
  }, []);

  // handleCloseClick already warns before an in-app navigation abandons a
  // pending request or active session. But a browser tab close/refresh/
  // address-bar navigation bypasses that entirely - the component just
  // unmounts, taking requestExpiryTimeoutRef/maxDurationTimeoutRef with it,
  // and nothing in the audit trail explains why an approved session never
  // auto-expired. Mirror the same guard at the window level. A ref (rather
  // than depending on sessionStatus directly) keeps this effect from
  // re-subscribing every render.
  const sessionStatusRef = useRef(sessionStatus);
  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const status = sessionStatusRef.current;
      if (status === SESSION_STATUS.ACTIVE || status === SESSION_STATUS.REQUESTED) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const settings = localStorage.getItem('cafeos_remote_assistance');
      if (settings) {
        const parsed = JSON.parse(settings);
        setRemoteEnabled(parsed.enabled || false);
        setSessionHistory(parsed.history || []);
      }
    } catch (e) {
      console.warn('Failed to load remote assistance settings:', e);
    }
  }, []);

  // Show message
  const showMessage = useCallback((type, text) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setMessage({ type, text });
    messageTimeoutRef.current = setTimeout(() => setMessage({ type: null, text: "" }), 5000);
  }, []);

  // Save settings to localStorage. Wrapped the same way persistAuditLog is -
  // localStorage.setItem can throw (quota exceeded, Safari private browsing
  // treats it as full), and an uncaught throw here would abort whatever
  // handler called it partway through, after React state was already
  // updated. Surface it as a message instead of a silent console-only warn,
  // since "your settings didn't actually save" is worth the user knowing.
  const saveSettings = useCallback((enabled, history) => {
    try {
      localStorage.setItem('cafeos_remote_assistance', JSON.stringify({
        enabled,
        history: history || sessionHistory,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[RemoteAssistance] Failed to save settings:', e);
      showMessage("warning", "Settings couldn't be saved locally. Changes may not persist after reload.");
    }
  }, [sessionHistory, showMessage]);

  // Persist an audit log entry. Previously these were only console.logged,
  // which means the "audit trail" the Security Notice promises didn't
  // actually survive a page reload or console clear.
  const persistAuditLog = useCallback((auditLog) => {
    try {
      const existingRaw = localStorage.getItem('cafeos_remote_audit_log');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [{ ...auditLog, loggedAt: new Date().toISOString() }, ...existing].slice(0, MAX_AUDIT_LOG_ENTRIES);
      localStorage.setItem('cafeos_remote_audit_log', JSON.stringify(updated));
    } catch (e) {
      console.warn('[RemoteAssistance] Failed to persist audit log:', e);
    }
  }, []);

  // Handle permission denial
  const handlePermissionDenied = useCallback((action, requiredPermission) => {
    setPermissionDialog({ open: true, action, requiredPermission });
    const denialLog = createPermissionDeniedAuditLog({
      userId: getCurrentUserId(),
      action,
      details: { requiredPermission }
    });
    persistAuditLog(denialLog);
    console.warn('[RemoteAssistance] Permission denied:', denialLog);
  }, [persistAuditLog]);

  // Ends the current session, whether triggered by the user clicking "End
  // Session" or automatically once MAX_SESSION_DURATION_MS is reached.
  // Pulled out into its own function so both call sites share one code
  // path instead of the ending logic drifting apart over time.
  const endSession = useCallback((reason = 'ended') => {
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (maxDurationWarningTimeoutRef.current) {
      clearTimeout(maxDurationWarningTimeoutRef.current);
      maxDurationWarningTimeoutRef.current = null;
    }

    const endTime = new Date();
    const duration = sessionStartTime ? Math.floor((endTime - sessionStartTime) / 1000) : 0;
    const validatedId = validateRustDeskId(rustDeskId);

    setSessionStatus(SESSION_STATUS.ENDED);
    setSessionDuration(duration);
    setIframeError(false);

    const newHistory = [{
      id: generateHistoryEntryId(),
      sessionCode: validatedId,
      startTime: sessionStartTime?.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      status: reason === 'max_duration_reached' ? 'auto_ended_max_duration' : 'ended'
    }, ...sessionHistory.slice(0, MAX_HISTORY_ENTRIES - 1)]; // Keep last MAX_HISTORY_ENTRIES sessions

    setSessionHistory(newHistory);
    saveSettings(remoteEnabled, newHistory);

    if (reason === 'max_duration_reached') {
      showMessage("warning", `Session automatically ended after reaching the ${Math.round(MAX_SESSION_DURATION_MS / 60000)}-minute safety limit.`);
    } else {
      showMessage("info", `Session ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    }

    // Audit log
    const auditLog = createRemoteSessionAuditLog({
      userId: getCurrentUserId(),
      action: reason === 'max_duration_reached' ? 'SESSION_AUTO_ENDED_MAX_DURATION' : 'SESSION_ENDED',
      details: {
        timestamp: endTime.toISOString(),
        rustDeskId: validatedId,
        duration,
        status: 'ended',
        reason
      }
    });
    console.log('[RemoteAssistance] Session ended:', auditLog);
    persistAuditLog(auditLog);

    setConfirmDialog({ open: false, onConfirm: null });

    // Reset after delay
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setSessionStatus(SESSION_STATUS.IDLE);
      setSessionStartTime(null);
      setSessionDuration(0);
      setIframeError(false);
      resetTimeoutRef.current = null;
    }, 3000);
  }, [rustDeskId, sessionStartTime, sessionHistory, remoteEnabled, saveSettings, showMessage, persistAuditLog]);

  // Toggle remote assistance
  const handleToggleRemote = useCallback((enabled) => {
    if (enabled && !canManageRemoteAccess) {
      handlePermissionDenied('ENABLE_REMOTE', 'MANAGE_REMOTE_ACCESS');
      return;
    }

    if (enabled) {
      setConfirmDialog({
        open: true,
        title: "Enable Remote Assistance",
        description: "This will enable remote assistance. You must approve each session before a support technician can connect.",
        confirmLabel: "Enable",
        onConfirm: () => {
          setRemoteEnabled(true);
          saveSettings(true);
          showMessage("success", "Remote assistance enabled. You must approve each session.");
          
          // Audit log
          const auditLog = createRemoteSessionAuditLog({
            userId: getCurrentUserId(),
            action: 'ENABLE_REMOTE',
            details: {
              timestamp: new Date().toISOString(),
              status: 'enabled'
            }
          });
          console.log('[RemoteAssistance] Remote assistance enabled:', auditLog);
          persistAuditLog(auditLog);
          
          setConfirmDialog({ open: false, onConfirm: null });
        }
      });
    } else {
      setConfirmDialog({
        open: true,
        title: "Disable Remote Assistance",
        description: "This will disable remote assistance. Any active sessions will be terminated.",
        confirmLabel: "Disable",
        onConfirm: () => {
          const wasInProgress = sessionStatus === SESSION_STATUS.ACTIVE || sessionStatus === SESSION_STATUS.REQUESTED;
          let newHistory = sessionHistory;

          if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
          }
          if (requestExpiryTimeoutRef.current) {
            clearTimeout(requestExpiryTimeoutRef.current);
            requestExpiryTimeoutRef.current = null;
          }
          if (maxDurationTimeoutRef.current) {
            clearTimeout(maxDurationTimeoutRef.current);
            maxDurationTimeoutRef.current = null;
          }
          if (maxDurationWarningTimeoutRef.current) {
            clearTimeout(maxDurationWarningTimeoutRef.current);
            maxDurationWarningTimeoutRef.current = null;
          }

          if (wasInProgress) {
            const endTime = new Date();
            const duration = sessionStartTime ? Math.floor((endTime - sessionStartTime) / 1000) : 0;
            const validatedId = validateRustDeskId(rustDeskId);
            newHistory = [{
              id: generateHistoryEntryId(),
              sessionCode: validatedId,
              startTime: sessionStartTime?.toISOString(),
              endTime: endTime.toISOString(),
              duration,
              status: 'force_terminated'
            }, ...sessionHistory.slice(0, MAX_HISTORY_ENTRIES - 1)];
            setSessionHistory(newHistory);

            const terminationLog = createRemoteSessionAuditLog({
              userId: getCurrentUserId(),
              action: 'SESSION_FORCE_TERMINATED',
              details: {
                timestamp: endTime.toISOString(),
                rustDeskId: validatedId,
                duration,
                reason: 'remote_assistance_disabled'
              }
            });
            console.log('[RemoteAssistance] Session force-terminated:', terminationLog);
            persistAuditLog(terminationLog);
          }

          setRemoteEnabled(false);
          setSessionStatus(SESSION_STATUS.IDLE);
          setSessionStartTime(null);
          setSessionDuration(0);
          setIframeError(false);
          saveSettings(false, newHistory);
          showMessage("info", wasInProgress
            ? "Remote assistance disabled. The in-progress session was terminated."
            : "Remote assistance disabled.");
          
          // Audit log
          const auditLog = createRemoteSessionAuditLog({
            userId: getCurrentUserId(),
            action: 'DISABLE_REMOTE',
            details: {
              timestamp: new Date().toISOString(),
              status: 'disabled'
            }
          });
          console.log('[RemoteAssistance] Remote assistance disabled:', auditLog);
          persistAuditLog(auditLog);
          
          setConfirmDialog({ open: false, onConfirm: null });
        }
      });
    }
  }, [saveSettings, showMessage, canManageRemoteAccess, handlePermissionDenied, persistAuditLog, sessionStatus, sessionHistory, rustDeskId, sessionStartTime]);

  // Request remote session
  const handleRequestSession = useCallback(() => {
    if (!remoteEnabled) {
      showMessage("error", "Remote assistance is disabled. Enable it first.");
      return;
    }
    
    const validatedId = validateRustDeskId(rustDeskId);
    if (!validatedId) {
      showMessage("error", "Please enter a valid 10-digit RustDesk ID.");
      return;
    }
    
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setActionPending(true);
    setTimeout(() => { actionInFlightRef.current = false; setActionPending(false); }, 500);

    const requestTime = new Date();
    setSessionStatus(SESSION_STATUS.REQUESTED);
    setSessionStartTime(requestTime);

    showMessage("info", `Session requested for RustDesk ID: ${validatedId}. Waiting for approval.`);
    
    // Audit log
    const auditLog = createRemoteSessionAuditLog({
      userId: getCurrentUserId(),
      action: 'SESSION_REQUESTED',
      details: {
        timestamp: requestTime.toISOString(),
        rustDeskId: validatedId,
        status: 'requested'
      }
    });
    console.log('[RemoteAssistance] Session requested:', auditLog);
    persistAuditLog(auditLog);

    // Auto-cancel if nobody approves it in time
    if (requestExpiryTimeoutRef.current) clearTimeout(requestExpiryTimeoutRef.current);
    requestExpiryTimeoutRef.current = setTimeout(() => {
      requestExpiryTimeoutRef.current = null;
      const endTime = new Date();
      const duration = Math.floor((endTime - requestTime) / 1000);

      setSessionStatus(SESSION_STATUS.IDLE);
      setSessionStartTime(null);
      setSessionDuration(0);
      showMessage("warning", "Session request expired before it was approved.");

      setSessionHistory((prevHistory) => {
        const newHistory = [{
          id: generateHistoryEntryId(),
          sessionCode: validatedId,
          startTime: requestTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          status: 'expired'
        }, ...prevHistory.slice(0, MAX_HISTORY_ENTRIES - 1)];
        saveSettings(remoteEnabled, newHistory);
        return newHistory;
      });

      const expiryLog = createRemoteSessionAuditLog({
        userId: getCurrentUserId(),
        action: 'SESSION_REQUEST_EXPIRED',
        details: {
          timestamp: endTime.toISOString(),
          rustDeskId: validatedId,
          duration,
          status: 'expired'
        }
      });
      console.log('[RemoteAssistance] Session request expired:', expiryLog);
      persistAuditLog(expiryLog);
    }, SESSION_REQUEST_TIMEOUT_MS);
  }, [remoteEnabled, rustDeskId, showMessage, persistAuditLog, saveSettings]);

  // Approve session
  const handleApproveSession = useCallback(() => {
    if (!canManageRemoteAccess) {
      handlePermissionDenied('SESSION_APPROVED', 'MANAGE_REMOTE_ACCESS');
      return;
    }
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setActionPending(true);
    setTimeout(() => { actionInFlightRef.current = false; setActionPending(false); }, 500);

    if (requestExpiryTimeoutRef.current) {
      clearTimeout(requestExpiryTimeoutRef.current);
      requestExpiryTimeoutRef.current = null;
    }

    const validatedId = validateRustDeskId(rustDeskId);
    setSessionStatus(SESSION_STATUS.ACTIVE);
    showMessage("success", "Remote session approved. Connecting to RustDesk web client...");

    // Safety cap: auto-end the session if it runs past MAX_SESSION_DURATION_MS
    if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
    maxDurationTimeoutRef.current = setTimeout(() => {
      maxDurationTimeoutRef.current = null;
      endSession('max_duration_reached');
    }, MAX_SESSION_DURATION_MS);

    // Give a heads-up before the cap kicks in
    if (maxDurationWarningTimeoutRef.current) clearTimeout(maxDurationWarningTimeoutRef.current);
    if (MAX_SESSION_DURATION_MS > MAX_DURATION_WARNING_LEAD_MS) {
      maxDurationWarningTimeoutRef.current = setTimeout(() => {
        maxDurationWarningTimeoutRef.current = null;
        showMessage("warning", `This session will automatically end in ${Math.round(MAX_DURATION_WARNING_LEAD_MS / 60000)} minutes due to the safety limit.`);
      }, MAX_SESSION_DURATION_MS - MAX_DURATION_WARNING_LEAD_MS);
    }
    
    // Audit log
    const auditLog = createRemoteSessionAuditLog({
      userId: getCurrentUserId(),
      action: 'SESSION_APPROVED',
      details: {
        timestamp: new Date().toISOString(),
        rustDeskId: validatedId,
        status: 'active'
      }
    });
    console.log('[RemoteAssistance] Session approved:', auditLog);
    persistAuditLog(auditLog);
  }, [rustDeskId, showMessage, canManageRemoteAccess, handlePermissionDenied, persistAuditLog, endSession]);

  // Cancel a requested (not yet approved) session
  const handleCancelRequest = useCallback(() => {
    if (requestExpiryTimeoutRef.current) {
      clearTimeout(requestExpiryTimeoutRef.current);
      requestExpiryTimeoutRef.current = null;
    }

    const endTime = new Date();
    const duration = sessionStartTime ? Math.floor((endTime - sessionStartTime) / 1000) : 0;
    const validatedId = validateRustDeskId(rustDeskId);

    const auditLog = createRemoteSessionAuditLog({
      userId: getCurrentUserId(),
      action: 'SESSION_CANCELLED',
      details: {
        timestamp: endTime.toISOString(),
        rustDeskId: validatedId,
        duration,
        status: 'cancelled'
      }
    });
    console.log('[RemoteAssistance] Session cancelled:', auditLog);
    persistAuditLog(auditLog);

    setSessionHistory((prevHistory) => {
      const newHistory = [{
        id: generateHistoryEntryId(),
        sessionCode: validatedId,
        startTime: sessionStartTime?.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: 'cancelled'
      }, ...prevHistory.slice(0, MAX_HISTORY_ENTRIES - 1)];
      saveSettings(remoteEnabled, newHistory);
      return newHistory;
    });

    setSessionStatus(SESSION_STATUS.IDLE);
    setSessionStartTime(null);
    setSessionDuration(0);
    showMessage("info", "Session request cancelled.");
  }, [rustDeskId, sessionStartTime, remoteEnabled, saveSettings, showMessage, persistAuditLog]);

  // End session (manual, via the "End Session" button + confirmation)
  const handleEndSession = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: "End Session",
      description: "This will end the active remote session. The support technician will be disconnected immediately.",
      confirmLabel: "End Session",
      onConfirm: () => endSession('ended')
    });
  }, [endSession]);

  // Closing the panel (header "Close" button). This used to call onCancel
  // directly regardless of sessionStatus - meaning someone could navigate
  // away mid-session and the component would unmount, silently clearing
  // requestExpiryTimeoutRef/maxDurationTimeoutRef along with it. Once
  // that happens, an approved session's auto-expiry and safety cutoff
  // simply never fire again, with nothing in the audit trail to explain
  // why. Now closing during a pending request or active session requires
  // acknowledging that first.
  const handleCloseClick = useCallback(() => {
    if (sessionStatus === SESSION_STATUS.REQUESTED) {
      setConfirmDialog({
        open: true,
        title: "Cancel Pending Request?",
        description: "A session request is still waiting for approval. Leaving this screen will cancel it.",
        confirmLabel: "Cancel Request & Leave",
        onConfirm: () => {
          handleCancelRequest();
          setConfirmDialog({ open: false, onConfirm: null });
          onCancel();
        }
      });
    } else if (sessionStatus === SESSION_STATUS.ACTIVE) {
      setConfirmDialog({
        open: true,
        title: "Leave with Session Active?",
        description: "A remote session is currently active and won't be disconnected by leaving this screen. The automatic time-limit safeguard also stops running once you navigate away. End the session first if you want it fully closed out.",
        confirmLabel: "Leave Anyway",
        onConfirm: () => {
          setConfirmDialog({ open: false, onConfirm: null });
          onCancel();
        }
      });
    } else {
      onCancel();
    }
  }, [sessionStatus, handleCancelRequest, onCancel]);

  // Update session duration - also ticks while REQUESTED so the UI can
  // show a live countdown to the request-expiry timeout, not just elapsed
  // time on an active session.
  useEffect(() => {
    let interval;
    if ((sessionStatus === SESSION_STATUS.ACTIVE || sessionStatus === SESSION_STATUS.REQUESTED) && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((new Date() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus, sessionStartTime]);

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, seconds || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // History entries used to always render the label "Ended", even for
  // entries whose actual status was force_terminated or (now)
  // auto_ended_max_duration - misleading for anyone reviewing the audit
  // trail to understand what actually happened.
  const SESSION_HISTORY_STATUS_LABELS = {
    ended: { label: "Ended", color: "var(--cafe-success)" },
    force_terminated: { label: "Force terminated", color: "var(--cafe-danger)" },
    auto_ended_max_duration: { label: "Auto-ended (time limit)", color: "var(--cafe-warning)" },
    cancelled: { label: "Cancelled", color: "var(--cafe-text-tertiary)" },
    expired: { label: "Expired (not approved)", color: "var(--cafe-text-tertiary)" }
  };
  const getHistoryStatusDisplay = (status) =>
    SESSION_HISTORY_STATUS_LABELS[status] || { label: "Unknown", color: "var(--cafe-text-tertiary)" };

  // Session codes are bearer credentials for remote desktop access. Once a
  // session is over the code itself is no longer needed for anything except
  // matching against the audit log, so there's no reason to keep displaying
  // Redact RustDesk ID for display in history - show only first and last 3 digits
  const redactSessionCode = (code) => {
    if (!code) return "—";
    if (code.length < 6) return code;
    return `${code.slice(0, 3)} ••• ${code.slice(-3)}`;
  };

  // A history entry's startTime can be missing or malformed (e.g. an older
  // schema loaded from localStorage) - new Date(undefined).toLocaleString()
  // silently renders the literal text "Invalid Date" to the user rather
  // than failing loudly, which looks like an app bug rather than a data gap.
  const formatHistoryTimestamp = (isoString) => {
    if (!isoString) return "Unknown time";
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? "Unknown time" : parsed.toLocaleString();
  };

  // Lookup table mirrors the SESSION_HISTORY_STATUS_LABELS pattern above -
  // one place to add a new banner tone instead of extending three separate
  // ternary chains for background/border/color.
  const MESSAGE_STYLES = {
    error: { background: "var(--cafe-danger-bg)", border: "var(--cafe-danger-border)", color: "var(--cafe-danger)" },
    success: { background: "var(--cafe-success-bg)", border: "var(--cafe-success-border)", color: "var(--cafe-success)" },
    warning: { background: "var(--cafe-warning-bg)", border: "var(--cafe-warning-border)", color: "var(--cafe-warning)" },
    info: { background: "var(--cafe-info-bg)", border: "var(--cafe-info-border)", color: "var(--cafe-info)" }
  };
  const messageStyle = MESSAGE_STYLES[message.type] || MESSAGE_STYLES.info;

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
            Remote Assistance
          </h2>
          <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: "4px 0 0" }}>
            Secure remote support with RustDesk integration
          </p>
        </div>
        <button onClick={handleCloseClick} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px" }}>
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
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            background: messageStyle.background,
            border: `1px solid ${messageStyle.border}`,
            color: messageStyle.color,
            fontSize: 13,
            fontWeight: 500
          }}
          role="status"
          aria-live={(message.type === "error" || message.type === "warning") ? "assertive" : "polite"}
          >
            <span>{message.text}</span>
            <button
              onClick={() => {
                if (messageTimeoutRef.current) {
                  clearTimeout(messageTimeoutRef.current);
                  messageTimeoutRef.current = null;
                }
                setMessage({ type: null, text: "" });
              }}
              aria-label="Dismiss message"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: 15,
                lineHeight: 1,
                padding: 0,
                opacity: 0.7
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Enable/Disable Card */}
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--cafe-text-primary)" }}>
                Remote Assistance Status
              </h3>
              <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: 0 }}>
                {remoteEnabled ? "Remote assistance is enabled" : "Remote assistance is disabled"}
              </p>
            </div>
            <div style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: remoteEnabled ? "var(--cafe-success-bg)" : "var(--cafe-warning-bg)",
              color: remoteEnabled ? "var(--cafe-success)" : "var(--cafe-warning)",
              border: `1px solid ${remoteEnabled ? "var(--cafe-success-border)" : "var(--cafe-warning-border)"}`
            }}>
              {remoteEnabled ? "✓ Enabled" : "⚠ Disabled"}
            </div>
          </div>

          <div style={{
            padding: 16,
            background: "var(--cafe-info-bg)",
            border: "1px solid var(--cafe-info-border)",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--cafe-info)"
          }}>
            <strong><span aria-hidden="true">🔒</span> Security Notice:</strong> Remote assistance requires your explicit approval for each session. 
            You can end any session at any time. All sessions are logged for audit purposes.
          </div>

          <button
            onClick={() => handleToggleRemote(!remoteEnabled)}
            role="switch"
            aria-checked={remoteEnabled}
            style={{
              ...btn(remoteEnabled ? "ghost" : "primary"),
              fontSize: 14,
              padding: "12px 24px",
              background: remoteEnabled ? "var(--cafe-danger-bg)" : undefined,
              border: remoteEnabled ? "1px solid var(--cafe-danger-border)" : undefined,
              color: remoteEnabled ? "var(--cafe-danger)" : undefined
            }}
          >
            {remoteEnabled ? "Disable Remote Assistance" : "Enable Remote Assistance"}
          </button>
        </div>

        {/* Session Control Card */}
        {remoteEnabled && (
          <div style={{ ...card, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Session Control
            </h3>

            {sessionStatus === SESSION_STATUS.IDLE && (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
                <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
                  Enter the client's RustDesk ID to connect to their computer remotely.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    value={rustDeskId}
                    onChange={(e) => setRustDeskId(e.target.value)}
                    placeholder="Enter client's RustDesk ID"
                    maxLength={12}
                    style={{
                      padding: "12px 16px",
                      fontSize: 16,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      width: "100%",
                      maxWidth: 300,
                      textAlign: "center",
                      letterSpacing: 2
                    }}
                  />
                </div>
                <button
                  onClick={handleRequestSession}
                  disabled={actionPending || !rustDeskId}
                  style={{ 
                    ...btn("primary"), 
                    fontSize: 14, 
                    padding: "12px 24px", 
                    opacity: (actionPending || !rustDeskId) ? 0.6 : 1, 
                    cursor: (actionPending || !rustDeskId) ? "default" : "pointer" 
                  }}
                >
                  Connect to Client
                </button>
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: "var(--cafe-info-bg)",
                  border: "1px solid var(--cafe-info-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--cafe-info)",
                  textAlign: "left"
                }}>
                  <strong>How to connect:</strong><br/>
                  1. Ask the client for their RustDesk ID (from their RustDesk app)<br/>
                  2. Click "Connect to Client" below<br/>
                  3. Enter the client's ID in the RustDesk web client that opens<br/>
                  4. Enter the password when prompted<br/>
                  5. Client must approve the connection on their end
                </div>
              </div>
            )}

            {sessionStatus === SESSION_STATUS.REQUESTED && (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                  Connecting to Client
                </p>
                <div style={{
                  padding: "16px 24px",
                  background: "var(--cafe-accent-bg)",
                  border: "2px solid var(--cafe-accent)",
                  borderRadius: 12,
                  marginBottom: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12
                }}>
                  <span
                    style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-accent)", letterSpacing: 2 }}
                  >
                    {rustDeskId}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 4, marginTop: 8 }}>
                  Client ID: {rustDeskId}
                </p>
                <p style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
                  Opening RustDesk web client to connect...
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button
                    onClick={handleApproveSession}
                    disabled={actionPending}
                    style={{ ...btn("primary"), fontSize: 14, padding: "12px 24px", opacity: actionPending ? 0.6 : 1, cursor: actionPending ? "default" : "pointer" }}
                  >
                    Open Connection
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    style={{ ...btn("ghost"), fontSize: 14, padding: "12px 24px" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {sessionStatus === SESSION_STATUS.ACTIVE && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {!iframeError ? (
                  <div style={{ 
                    flex: 1, 
                    minHeight: 400, 
                    background: "#000", 
                    borderRadius: 8, 
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    <iframe
                      src="https://web.rustdesk.com/"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none"
                      }}
                      title="RustDesk Web Client - Remote Desktop Connection"
                      allow="camera; microphone; display-capture"
                      referrerPolicy="no-referrer"
                      onError={() => setIframeError(true)}
                      onLoad={() => setIframeError(false)}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    flex: 1, 
                    minHeight: 400, 
                    background: "var(--cafe-bg-elevated)", 
                    borderRadius: 8, 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    textAlign: "center"
                  }}>
                    <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--cafe-text-primary)" }}>
                      Embedded View Unavailable
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 16, maxWidth: 400 }}>
                      The RustDesk web client cannot be displayed embedded due to browser security restrictions or network issues. Please open it in a new tab.
                    </p>
                    <button
                      onClick={() => window.open("https://web.rustdesk.com/", '_blank')}
                      style={{ ...btn("primary"), fontSize: 14, padding: "12px 24px" }}
                    >
                      Open RustDesk Web Client
                    </button>
                  </div>
                )}
                <div style={{ 
                  padding: "16px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  background: "var(--cafe-bg-elevated)",
                  borderTop: "1px solid var(--cafe-border)",
                  borderRadius: "0 0 8px 8px"
                }}>
                  <div>
                    <p style={{ fontSize: 14, color: "var(--cafe-success)", fontWeight: 600, margin: 0 }}>
                      Connected to Client: {rustDeskId}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", margin: "4px 0 0" }}>
                      Session Duration: {formatDuration(sessionDuration)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {!iframeError && (
                      <button
                        onClick={() => window.open("https://web.rustdesk.com/", '_blank')}
                        style={{ ...btn("ghost"), fontSize: 13, padding: "8px 16px" }}
                      >
                        Open in New Tab
                      </button>
                    )}
                    <button
                      onClick={handleEndSession}
                      style={{
                        ...btn("ghost"),
                        fontSize: 14,
                        padding: "12px 24px",
                        background: "var(--cafe-danger-bg)",
                        border: "1px solid var(--cafe-danger-border)",
                        color: "var(--cafe-danger)"
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sessionStatus === SESSION_STATUS.ENDED && (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <p style={{ fontSize: 14, color: "var(--cafe-success)", fontWeight: 600, marginBottom: 8 }}>
                  Session Ended
                </p>
                <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
                  Duration: {formatDuration(sessionDuration)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Session History Card - shown regardless of the current enabled/
            disabled state, since it's an audit record of past sessions,
            not a live control. */}
        {sessionHistory.length > 0 && (
          <div style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Session History
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessionHistory.map((session) => {
                const statusDisplay = getHistoryStatusDisplay(session.status);
                return (
                  <div
                    key={session.id}
                    style={{
                      padding: "12px 16px",
                      background: "var(--cafe-bg)",
                      border: "1px solid var(--cafe-border-light)",
                      borderRadius: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        Code: {redactSessionCode(session.sessionCode)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        {formatHistoryTimestamp(session.startTime)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
                        {formatDuration(session.duration)}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: statusDisplay.color,
                        fontWeight: 600
                      }}>
                        {statusDisplay.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
      />

      <PermissionDeniedDialog
        open={permissionDialog.open}
        onClose={() => setPermissionDialog({ open: false, action: "", requiredPermission: "" })}
        action={permissionDialog.action}
        requiredPermission={permissionDialog.requiredPermission}
        currentRole={currentUserRole}
        contactMessage="Contact your system administrator for access."
      />
    </div>
  );
}
