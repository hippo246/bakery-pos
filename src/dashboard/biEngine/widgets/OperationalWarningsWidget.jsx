/**
 * Operational Warnings Widget
 * Displays threshold-based operational warnings
 */

import React, { useState, useEffect, memo } from 'react';
import businessRulesEngine from '../BusinessRulesEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function OperationalWarningsWidget({ instance, settings }) {
  const [warnings, setWarnings] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchWarnings = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      businessRulesEngine.initialize();
      const triggeredRules = businessRulesEngine.executeAllRules(liveData);
      
      // Filter for high-priority and critical rules only
      const warningRules = triggeredRules.filter(rule => 
        rule.priority === 'critical' || rule.priority === 'high'
      );

      setWarnings(warningRules);
      setLastUpdate(Date.now());
    };

    fetchWarnings();
    const interval = setInterval(fetchWarnings, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--cafe-danger)';
      case 'high': return 'var(--cafe-warning)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getSeverityBg = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--cafe-danger-bg)';
      case 'high': return 'var(--cafe-warning-bg)';
      default: return 'var(--cafe-bg-surface)';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'kitchen': return '👨‍🍳';
      case 'inventory': return '📦';
      case 'tables': return '🪑';
      case 'payments': return '💳';
      case 'orders': return '📋';
      case 'staff': return '👤';
      default: return '⚠️';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Operational Warnings
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {warnings.length > 0 && (
          <div style={{ 
            padding: '4px 12px', 
            background: 'var(--cafe-danger-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cafe-danger)'
          }}>
            {warnings.length}
          </div>
        )}
      </div>

      {/* Warnings List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {warnings.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: 'var(--cafe-success)',
            fontSize: 14
          }}>
            ✓ No operational warnings
          </div>
        ) : (
          warnings.map((warning, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                background: getSeverityBg(warning.priority),
                border: `1px solid ${getSeverityColor(warning.priority)}`,
                borderRadius: 8,
                marginBottom: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{getCategoryIcon(warning.category)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: getSeverityColor(warning.priority)
                  }}>
                    {warning.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
                    {warning.message}
                  </div>
                  <div style={{ 
                    padding: 8, 
                    background: 'var(--cafe-bg-card)', 
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--cafe-text-tertiary)',
                    marginTop: 8
                  }}>
                    <div><strong>Area:</strong> {warning.affectedArea}</div>
                    <div><strong>Impact:</strong> {warning.businessImpact}</div>
                    <div><strong>Suggested:</strong> {warning.suggestedAction}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(OperationalWarningsWidget);
