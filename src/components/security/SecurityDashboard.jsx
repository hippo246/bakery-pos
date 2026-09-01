// Security Dashboard
// Comprehensive security monitoring and management interface

import React, { useState, useEffect, useMemo } from 'react';
import { getEncryptionEngine } from '../../security/EncryptionEngine.js';
import { getPermissionEngine } from '../../security/PermissionEngine.js';
import { getSessionManager } from '../../security/SessionManager.js';
import { getSecurityMonitor } from '../../security/SecurityMonitor.js';
import { getDataIntegrity } from '../../security/DataIntegrity.js';
import { getEncryptedStorage } from '../../security/EncryptedStorage.js';
import { SecurityLevel, SecurityStatus } from '../../security/SecurityTypes.js';

export default function SecurityDashboard() {
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState({
    encryption: null,
    permissions: null,
    sessions: null,
    monitor: null,
    integrity: null,
    storage: null
  });
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const encryptionEngine = getEncryptionEngine();
      const permissionEngine = getPermissionEngine();
      const sessionManager = getSessionManager();
      const securityMonitor = getSecurityMonitor();
      const dataIntegrity = getDataIntegrity();
      const encryptedStorage = getEncryptedStorage();

      await Promise.all([
        encryptionEngine.initialize(),
        permissionEngine.initialize(),
        sessionManager.initialize(),
        securityMonitor.initialize(),
        dataIntegrity.initialize(),
        encryptedStorage.initialize()
      ]);

      setSecurityData({
        encryption: {
          status: encryptionEngine.getStatusInfo(),
          score: encryptionEngine.getSecurityScore(),
          recommendations: encryptionEngine.getRecommendations()
        },
        permissions: {
          stats: permissionEngine.getStatistics(),
          score: permissionEngine.getSecurityScore(),
          recommendations: permissionEngine.getRecommendations()
        },
        sessions: {
          stats: sessionManager.getStatistics(),
          score: sessionManager.getSecurityScore(),
          recommendations: sessionManager.getRecommendations()
        },
        monitor: {
          stats: securityMonitor.getStatistics(),
          score: securityMonitor.getSecurityScore(),
          recommendations: securityMonitor.getRecommendations()
        },
        integrity: {
          stats: dataIntegrity.getStatistics(),
          score: dataIntegrity.getSecurityScore(),
          recommendations: dataIntegrity.getRecommendations()
        },
        storage: {
          size: encryptedStorage.getSize(),
          enabled: encryptedStorage.isEnabled()
        }
      });

      setAlerts(securityMonitor.getAlerts({ resolved: false }));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setLoading(false);
    }
  };

  const overallSecurityScore = useMemo(() => {
    if (!securityData.encryption || !securityData.permissions || 
        !securityData.sessions || !securityData.monitor || !securityData.integrity) {
      return 0;
    }

    const scores = [
      securityData.encryption.score,
      securityData.permissions.score,
      securityData.sessions.score,
      securityData.monitor.score,
      securityData.integrity.score
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [securityData]);

  const getSecurityLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: '#10b981' };
    if (score >= 75) return { level: 'Good', color: '#3b82f6' };
    if (score >= 60) return { level: 'Fair', color: '#f59e0b' };
    if (score >= 40) return { level: 'Poor', color: '#f97316' };
    return { level: 'Critical', color: '#ef4444' };
  };

  const securityLevel = getSecurityLevel(overallSecurityScore);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔒</div>
          <div>Loading Security Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#0f172a', 
      minHeight: '100vh', 
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#0a0a0a',
        padding: '24px',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
              🔒 Security Center
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#94a3b8' }}>
              Comprehensive security monitoring and management
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: securityLevel.color }}>
              {overallSecurityScore}
            </div>
            <div style={{ fontSize: '14px', color: securityLevel.color, fontWeight: '600' }}>
              {securityLevel.level} Security Score
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#0a0a0a',
        borderBottom: '1px solid #334155',
        padding: '0 24px'
      }}>
        {['overview', 'encryption', 'permissions', 'sessions', 'alerts', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '16px 24px',
              background: activeTab === tab ? '#334155' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'overview' && (
          <OverviewTab 
            securityData={securityData} 
            alerts={alerts}
            overallScore={overallSecurityScore}
            securityLevel={securityLevel}
          />
        )}
        {activeTab === 'encryption' && (
          <EncryptionTab data={securityData.encryption} />
        )}
        {activeTab === 'permissions' && (
          <PermissionsTab data={securityData.permissions} />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab data={securityData.sessions} />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab alerts={alerts} onRefresh={loadSecurityData} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab securityData={securityData} />
        )}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ securityData, alerts, overallScore, securityLevel }) {
  const cards = [
    {
      title: 'Encryption',
      value: securityData.encryption?.score || 0,
      icon: '🔐',
      status: securityData.encryption?.status
    },
    {
      title: 'Permissions',
      value: securityData.permissions?.score || 0,
      icon: '👥',
      status: securityData.permissions?.stats?.total
    },
    {
      title: 'Sessions',
      value: securityData.sessions?.score || 0,
      icon: '🔑',
      status: securityData.sessions?.stats?.active
    },
    {
      title: 'Monitoring',
      value: securityData.monitor?.score || 0,
      icon: '📊',
      status: securityData.monitor?.stats?.monitoringActive
    },
    {
      title: 'Data Integrity',
      value: securityData.integrity?.score || 0,
      icon: '✅',
      status: securityData.integrity?.stats?.total
    },
    {
      title: 'Active Alerts',
      value: alerts.filter(a => !a.resolved).length,
      icon: '⚠️',
      status: alerts.filter(a => !a.resolved).length === 0 ? 'None' : 'Active'
    }
  ];

  return (
    <div>
      {/* Score Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {cards.map((card, index) => (
          <div key={index} style={{
            background: '#0a0a0a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {typeof card.value === 'number' ? card.value : card.value}
                </div>
              </div>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                background: `conic-gradient(${getScoreColor(card.value)} ${card.value}%, #334155 0)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#0a0a0a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {typeof card.value === 'number' ? card.value : ''}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Run Security Scan
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Rotate Encryption Keys
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Export Security Report
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Lock All Sessions
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Recent Alerts</h3>
        {alerts.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '20px 0' }}>No recent alerts</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} style={{
                padding: '12px',
                background: alert.severity === 'critical' ? '#7f1d1d' : 
                           alert.severity === 'warning' ? '#78350f' : '#0a0a0a',
                borderRadius: '8px',
                border: `1px solid ${alert.severity === 'critical' ? '#dc2626' : 
                                   alert.severity === 'warning' ? '#ea580c' : '#334155'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>{alert.message}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Encryption Tab
function EncryptionTab({ data }) {
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Encryption Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Status</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.status}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Algorithm</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.status?.algorithm || 'AES-GCM'}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Key Size</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.status?.keySize || 256} bits</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Last Modified</div>
            <div style={{ fontSize: '14px' }}>{data.status?.lastModified || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Recommendations</h3>
        {data.recommendations?.length === 0 ? (
          <div style={{ color: '#10b981' }}>✓ No recommendations</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.recommendations?.map((rec, index) => (
              <div key={index} style={{
                padding: '12px',
                background: rec.level === 'critical' ? '#7f1d1d' : 
                           rec.level === 'warning' ? '#78350f' : '#0a0a0a',
                borderRadius: '8px',
                border: `1px solid ${rec.level === 'critical' ? '#dc2626' : 
                                   rec.level === 'warning' ? '#ea580c' : '#334155'}`
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{rec.message}</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>{rec.action}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Permissions Tab
function PermissionsTab({ data }) {
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Permission Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Checks</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.stats?.total || 0}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Allowed</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {data.stats?.allowed || 0}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Denied</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {data.stats?.denied || 0}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Allow Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {data.stats?.allowRate?.toFixed(1) || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sessions Tab
function SessionsTab({ data }) {
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Session Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Sessions</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.stats?.total || 0}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Active</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {data.stats?.active || 0}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Expired</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {data.stats?.expired || 0}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Locked</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: data.stats?.locked ? '#ef4444' : '#10b981' }}>
              {data.stats?.locked ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts Tab
function AlertsTab({ alerts, onRefresh }) {
  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Security Alerts</h3>
        <button 
          onClick={onRefresh}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={{
          background: '#0a0a0a',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '18px', color: '#10b981' }}>No active alerts</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert, index) => (
            <div key={index} style={{
              background: '#0a0a0a',
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid ${alert.severity === 'critical' ? '#dc2626' : 
                                 alert.severity === 'warning' ? '#ea580c' : '#334155'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ 
                  fontWeight: '600',
                  color: alert.severity === 'critical' ? '#ef4444' : 
                         alert.severity === 'warning' ? '#f59e0b' : '#fff'
                }}>
                  {alert.severity.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>{alert.message}</div>
              {alert.acknowledged && (
                <div style={{ fontSize: '12px', color: '#10b981' }}>✓ Acknowledged</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Recommendations Tab
function RecommendationsTab({ securityData }) {
  const allRecommendations = [
    ...(securityData.encryption?.recommendations || []),
    ...(securityData.permissions?.recommendations || []),
    ...(securityData.sessions?.recommendations || []),
    ...(securityData.monitor?.recommendations || []),
    ...(securityData.integrity?.recommendations || [])
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Security Recommendations</h3>
      
      {allRecommendations.length === 0 ? (
        <div style={{
          background: '#0a0a0a',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontSize: '18px', color: '#10b981' }}>All systems secure!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allRecommendations.map((rec, index) => (
            <div key={index} style={{
              background: '#0a0a0a',
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid ${rec.level === 'critical' ? '#dc2626' : 
                                 rec.level === 'warning' ? '#ea580c' : '#334155'}`
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px',
                color: rec.level === 'critical' ? '#ef4444' : 
                       rec.level === 'warning' ? '#f59e0b' : '#fff'
              }}>
                {rec.level.toUpperCase()}: {rec.message}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                Action: {rec.action}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}
