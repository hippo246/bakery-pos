/**
 * HealthMonitor Component
 * Real-time health monitoring dashboard for self-healing system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AlertDialog from './AlertDialog.jsx';
import { getSelfHealingEngine } from '../../operations/SelfHealingEngine.js';

export default function HealthMonitor({ visible = false, onClose }) {
  const [healthStatus, setHealthStatus] = useState(null);
  const [recoveryQueue, setRecoveryQueue] = useState(null);
  const [circuitBreakers, setCircuitBreakers] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const healingEngine = getSelfHealingEngine();
  const initializedRef = useRef(false);

  const updateHealthData = useCallback(() => {
    const status = healingEngine.getHealthStatus();
    const queue = healingEngine.getRecoveryQueueStatus();
    const breakers = healingEngine.getAllHealingActionConfigs?.() || {};

    setHealthStatus(status);
    setRecoveryQueue(queue);
    setCircuitBreakers(breakers);
    setLastUpdate(new Date().toLocaleTimeString());
  }, [healingEngine]);

  useEffect(() => {
    if (!visible) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      updateHealthData();
    }

    // Set up auto-refresh (increased from 5s to 30s to reduce CPU usage)
    let interval;
    if (autoRefresh) {
      interval = setInterval(updateHealthData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (!visible) initializedRef.current = false;
    };
  }, [visible, autoRefresh, updateHealthData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      case 'unknown': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      case 'unknown': return '❓';
      default: return '❓';
    }
  };

  const handleProcessQueue = async () => {
    const result = await healingEngine.processRecoveryQueue();
    updateHealthData();
    setAlertDialog({ isOpen: true, title: 'Queue Processed', message: `Processed ${result.processed} items, ${result.remaining} remaining`, type: 'success' });
  };

  const handleResetCircuitBreakers = () => {
    healingEngine.resetCircuitBreakers();
    updateHealthData();
  };

  if (!visible) return null;

  const containerStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1E1E1E',
    border: '2px solid #333',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '600px',
    maxWidth: '800px',
    maxHeight: '80vh',
    overflowY: 'auto',
    color: '#FFFFFF',
    zIndex: 10000,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#E63946'
  };

  const closeButtonStyle = {
    backgroundColor: '#333',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  };

  const sectionStyle = {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    border: '1px solid #333'
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#FFD166',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const healthGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  };

  const healthCardStyle = (status) => ({
    backgroundColor: '#1E1E1E',
    border: `2px solid ${getStatusColor(status)}`,
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  });

  const healthCardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#AAA'
  };

  const healthValueStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: getStatusColor('healthy')
  };

  const healthDetailStyle = {
    fontSize: '11px',
    color: '#888'
  };

  const queueItemStyle = {
    backgroundColor: '#1E1E1E',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '8px',
    fontSize: '12px'
  };

  const actionButtonStyle = {
    backgroundColor: '#E63946',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px'
  };

  const secondaryButtonStyle = {
    backgroundColor: '#333',
    color: '#FFF',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  };

  const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#AAA'
  };

  const timestampStyle = {
    fontSize: '11px',
    color: '#666',
    marginTop: '15px',
    textAlign: 'right'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>🏥 System Health Monitor</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={toggleStyle}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button onClick={onClose} style={closeButtonStyle}>Close</button>
        </div>
      </div>

      {/* Health Status */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>System Health</div>
        {healthStatus ? (
          <div style={healthGridStyle}>
            {Object.entries(healthStatus).map(([key, value]) => (
              <div key={key} style={healthCardStyle(value.status)}>
                <div style={healthCardHeaderStyle}>
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>{getStatusIcon(value.status)}</span>
                </div>
                <div style={healthValueStyle}>{value.status.toUpperCase()}</div>
                <div style={healthDetailStyle}>
                  {value.usage && `Usage: ${value.usage}`}
                  {value.usagePercent && ` (${value.usagePercent}%)`}
                  {value.error && `Error: ${value.error}`}
                  {value.message && value.message}
                  {value.openBreakers && `${value.openBreakers.length} open`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: '14px' }}>Loading health status...</div>
        )}
      </div>

      {/* Recovery Queue */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          Recovery Queue
          {recoveryQueue && recoveryQueue.length > 0 && ` (${recoveryQueue.length} items)`}
        </div>
        {recoveryQueue && recoveryQueue.length > 0 ? (
          <div>
            {recoveryQueue.slice(0, 5).map((item) => (
              <div key={item.id} style={queueItemStyle}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {item.operationType}
                </div>
                <div style={{ color: '#888', fontSize: '11px' }}>
                  Attempts: {item.attempts} | Time: {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {recoveryQueue.length > 5 && (
              <div style={{ color: '#888', fontSize: '11px', marginTop: '8px' }}>
                +{recoveryQueue.length - 5} more items
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <button onClick={handleProcessQueue} style={actionButtonStyle}>
                Process Queue
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#22C55E', fontSize: '14px' }}>✅ Queue is empty</div>
        )}
      </div>

      {/* Circuit Breakers */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Circuit Breakers</div>
        {circuitBreakers ? (
          <div style={healthGridStyle}>
            {Object.entries(circuitBreakers).map(([key, value]) => (
              <div key={key} style={healthCardStyle(value.enabled ? 'healthy' : 'unknown')}>
                <div style={healthCardHeaderStyle}>
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>{value.enabled ? '✅' : '⚪'}</span>
                </div>
                <div style={healthDetailStyle}>
                  Enabled: {value.enabled ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: '14px' }}>Loading circuit breakers...</div>
        )}
        <div style={{ marginTop: '12px' }}>
          <button onClick={handleResetCircuitBreakers} style={secondaryButtonStyle}>
            Reset Circuit Breakers
          </button>
        </div>
      </div>

      <div style={timestampStyle}>
        Last updated: {lastUpdate || 'Never'}
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
