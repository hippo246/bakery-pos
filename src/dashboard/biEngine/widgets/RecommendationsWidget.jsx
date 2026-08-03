/**
 * Recommendations Widget
 * Displays actionable business recommendations with explainability
 */

import React, { useState, useEffect, memo } from 'react';
import recommendationEngine from '../RecommendationEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';
import businessIntelligenceEngine from '../BusinessIntelligenceEngine.js';

function RecommendationsWidget({ instance, settings }) {
  const [recommendations, setRecommendations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchRecommendations = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      recommendationEngine.initialize();
      businessIntelligenceEngine.initialize();
      
      const config = businessIntelligenceEngine.getConfiguration();
      const recs = recommendationEngine.generateRecommendations(liveData, config);
      
      recommendationEngine.storeRecommendations(recs);
      setRecommendations(recs);
      setLastUpdate(Date.now());
    };

    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 45000);

    return () => clearInterval(interval);
  }, []);

  const acknowledgeRec = (recId) => {
    recommendationEngine.acknowledgeRecommendation(recId);
    setRecommendations(prev => prev.map(r => 
      r.id === recId ? { ...r, acknowledged: true } : r
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--cafe-danger)';
      case 'high': return 'var(--cafe-warning)';
      case 'medium': return 'var(--cafe-info)';
      case 'low': return 'var(--cafe-text-secondary)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--cafe-danger-bg)';
      case 'high': return 'var(--cafe-warning-bg)';
      case 'medium': return 'var(--cafe-info-bg)';
      case 'low': return 'var(--cafe-bg-surface)';
      default: return 'var(--cafe-bg-surface)';
    }
  };

  const activeRecommendations = recommendations.filter(r => !r.acknowledged);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Recommendations
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {activeRecommendations.length > 0 && (
          <div style={{ 
            padding: '4px 12px', 
            background: 'var(--cafe-accent-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cafe-accent)'
          }}>
            {activeRecommendations.length} Active
          </div>
        )}
      </div>

      {/* Recommendations List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeRecommendations.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: 'var(--cafe-success)',
            fontSize: 14
          }}>
            ✓ No recommendations at this time
          </div>
        ) : (
          activeRecommendations.map((rec) => (
            <div
              key={rec.id}
              style={{
                padding: 12,
                background: getPriorityBg(rec.priority),
                border: `1px solid ${getPriorityColor(rec.priority)}`,
                borderRadius: 8,
                marginBottom: 8,
                opacity: rec.acknowledged ? 0.5 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: getPriorityColor(rec.priority)
                  }}>
                    {rec.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
                    {rec.message}
                  </div>
                </div>
                <div style={{ 
                  padding: '2px 8px', 
                  background: 'var(--cafe-bg-card)',
                  borderRadius: 4,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: getPriorityColor(rec.priority),
                  fontWeight: 600
                }}>
                  {rec.priority}
                </div>
              </div>

              {/* Explainability */}
              <div style={{ 
                padding: 8, 
                background: 'var(--cafe-bg-card)', 
                borderRadius: 6,
                fontSize: 11,
                color: 'var(--cafe-text-tertiary)',
                marginTop: 8
              }}>
                <div><strong>Why:</strong> {rec.reason}</div>
                <div><strong>Impact:</strong> {rec.businessImpact}</div>
                <div><strong>Action:</strong> {rec.suggestedAction}</div>
                <div><strong>Confidence:</strong> {rec.confidence}%</div>
                <div><strong>Data Source:</strong> {rec.dataSources.join(', ')}</div>
              </div>

              {!rec.acknowledged && (
                <button
                  onClick={() => acknowledgeRec(rec.id)}
                  style={{
                    marginTop: 8,
                    padding: '6px 12px',
                    background: 'var(--cafe-bg-surface)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: 'var(--cafe-text-secondary)'
                  }}
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Acknowledged Count */}
      {recommendations.some(r => r.acknowledged) && (
        <div style={{ 
          padding: 8, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--cafe-text-tertiary)',
          textAlign: 'center'
        }}>
          {recommendations.filter(r => r.acknowledged).length} acknowledged
        </div>
      )}
    </div>
  );
}

export default memo(RecommendationsWidget);
