/**
 * Menu Intelligence Widget
 * Displays menu performance analytics and insights
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function MenuIntelligenceWidget({ instance, settings }) {
  const [menuData, setMenuData] = useState({
    bestSellers: [],
    lowestSellers: [],
    highestRevenueItems: [],
    highestMarginItems: [],
    frequentlyPaired: [],
    averagePrepTime: 0,
    frequentlyCancelled: []
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchMenuData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateMenuAnalytics(liveData);

      setMenuData(analytics);
      setLastUpdate(Date.now());
    };

    fetchMenuData();
    const interval = setInterval(fetchMenuData, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Menu Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Best Sellers */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-success)', fontWeight: 600, marginBottom: 8 }}>
          Best Sellers
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {menuData.bestSellers.map((item, index) => (
            <span key={index} style={{ 
              padding: '4px 8px', 
              background: 'var(--cafe-success-bg)', 
              border: '1px solid var(--cafe-success-border)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--cafe-success)'
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Lowest Sellers */}
      {menuData.lowestSellers.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 8 }}>
          Lowest Sellers
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {menuData.lowestSellers.map((item, index) => (
              <span key={index} style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-warning-bg)', 
                border: '1px solid var(--cafe-warning-border)',
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--cafe-warning)'
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Highest Revenue Items */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-accent)', fontWeight: 600, marginBottom: 8 }}>
          Highest Revenue Items
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {menuData.highestRevenueItems.map((item, index) => (
            <span key={index} style={{ 
              padding: '4px 8px', 
              background: 'var(--cafe-accent-bg)', 
              border: '1px solid var(--cafe-accent-border)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--cafe-accent)'
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Frequently Paired */}
      {menuData.frequentlyPaired.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-info)', fontWeight: 600, marginBottom: 8 }}>
            Frequently Paired
          </div>
          {menuData.frequentlyPaired.map((pair, index) => (
            <div key={index} style={{ 
              padding: 6, 
              background: 'var(--cafe-info-bg)', 
              border: '1px solid var(--cafe-info-border)',
              borderRadius: 4,
              marginBottom: 4,
              fontSize: 11,
              color: 'var(--cafe-info)'
            }}>
              {pair.join(' + ')}
            </div>
          ))}
        </div>
      )}

      {/* Average Prep Time */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Average Prep Time</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
          {menuData.averagePrepTime}m
        </div>
      </div>
    </div>
  );
}

export default memo(MenuIntelligenceWidget);
