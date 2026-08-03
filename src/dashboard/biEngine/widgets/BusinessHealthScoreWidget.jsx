/**
 * Business Health Score Widget
 * Displays overall business health with breakdown and deductions
 */

import React, { useState, useEffect, memo } from 'react';
import businessIntelligenceEngine from '../BusinessIntelligenceEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function BusinessHealthScoreWidget({ instance, settings }) {
  const [healthData, setHealthData] = useState({
    overall: 0,
    status: 'Good',
    breakdown: {},
    deductions: []
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchHealth = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      businessIntelligenceEngine.initialize();
      const health = businessIntelligenceEngine.calculateBusinessHealth(liveData);

      setHealthData(health);
      setLastUpdate(Date.now());
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score) => {
    if (score >= 90) return 'var(--cafe-success)';
    if (score >= 75) return 'var(--cafe-info)';
    if (score >= 60) return 'var(--cafe-warning)';
    return 'var(--cafe-danger)';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'var(--cafe-success)';
      case 'Good': return 'var(--cafe-info)';
      case 'Needs Attention': return 'var(--cafe-warning)';
      case 'Critical': return 'var(--cafe-danger)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--cafe-success)';
    if (score >= 70) return 'var(--cafe-info)';
    if (score >= 55) return 'var(--cafe-warning)';
    return 'var(--cafe-danger)';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Business Health
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: `${getStatusColor(healthData.status)}20`,
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: getStatusColor(healthData.status)
        }}>
          {healthData.status}
        </div>
      </div>

      {/* Overall Score */}
      <div style={{ 
        padding: 20, 
        background: `${getHealthColor(healthData.overall)}15`,
        border: `2px solid ${getHealthColor(healthData.overall)}`,
        borderRadius: 12,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: getHealthColor(healthData.overall), fontFamily: 'monospace' }}>
          {healthData.overall}
        </div>
        <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
          Overall Score
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Component Breakdown
        </div>
        {Object.entries(healthData.breakdown).map(([component, score]) => (
          <div key={component} style={{ 
            padding: 10, 
            background: 'var(--cafe-bg-surface)', 
            border: '1px solid var(--cafe-border)',
            borderRadius: 6,
            marginBottom: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 13, color: 'var(--cafe-text-primary)', textTransform: 'capitalize' }}>
              {component.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              color: getScoreColor(score),
              fontFamily: 'monospace'
            }}>
              {score}
            </div>
          </div>
        ))}
      </div>

      {/* Deductions */}
      {healthData.deductions.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-danger)', fontWeight: 600, marginBottom: 8 }}>
            Score Deductions
          </div>
          {healthData.deductions.map((deduction, index) => (
            <div key={index} style={{ 
              padding: 8, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 6,
              marginBottom: 4,
              fontSize: 12,
              color: 'var(--cafe-danger)'
            }}>
              <div style={{ fontWeight: 600 }}>{deduction.component}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>{deduction.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(BusinessHealthScoreWidget);
