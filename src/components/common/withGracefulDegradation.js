/**
 * withGracefulDegradation HOC
 * Wraps components with graceful degradation capabilities
 */

import React, { useState, useEffect } from 'react';

export function withGracefulDegradation(WrappedComponent, degradationStrategies = {}) {
  return function GracefulDegradationWrapper(props) {
    const [degradedMode, setDegradedMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      checkComponentHealth();
    }, []);

    const checkComponentHealth = async () => {
      setLoading(true);
      
      try {
        // Check if component has health check strategy
        if (degradationStrategies.healthCheck) {
          const healthy = await degradationStrategies.healthCheck();
          
          if (!healthy) {
            setDegradedMode('simplified');
          }
        }
      } catch (err) {
        console.error('[GracefulDegradation] Health check failed:', err);
        setError(err.message);
        setDegradedMode('simplified');
      } finally {
        setLoading(false);
      }
    };

    const handleRetry = async () => {
      setDegradedMode(null);
      setError(null);
      await checkComponentHealth();
    };

    const renderSimplifiedVersion = () => {
      if (degradationStrategies.simplifiedComponent) {
        const SimplifiedComponent = degradationStrategies.simplifiedComponent;
        return <SimplifiedComponent {...props} onRetry={handleRetry} />;
      }

      // Default simplified fallback
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#FFF3CD',
          border: '2px solid #FFC107',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
            {degradationStrategies.fallbackMessage || 'This feature is currently unavailable'}
          </div>
          <button
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#E63946',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      );
    };

    const renderCachedVersion = () => {
      if (degradationStrategies.cachedComponent) {
        const CachedComponent = degradationStrategies.cachedComponent;
        return <CachedComponent {...props} isCached={true} />;
      }

      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#E8F4FD',
          border: '2px solid #2196F3',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
            Showing cached data - connection unavailable
          </div>
          <button
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Refresh
          </button>
        </div>
      );
    };

    if (loading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Checking component health...</div>
        </div>
      );
    }

    if (error && degradationStrategies.showError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#FEE',
          border: '2px solid #F44336',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
            Error: {error}
          </div>
          <button
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F44336',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    if (degradedMode === 'simplified') {
      return renderSimplifiedVersion();
    }

    if (degradedMode === 'cached') {
      return renderCachedVersion();
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Specific degradation strategies for common components
 */

// Kitchen display degradation strategy
export const kitchenDisplayStrategies = {
  healthCheck: async () => {
    // Check WebSocket connection
    const wsConnected = localStorage.getItem('kitchen_ws_connected') === 'true';
    return wsConnected;
  },
  simplifiedComponent: function SimplifiedKitchenDisplay({ orders, onRetry }) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1E1E1E', color: '#FFF' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          🍳 Kitchen Display (Simplified Mode)
        </div>
        <div style={{ fontSize: '12px', color: '#AAA', marginBottom: '20px' }}>
          Real-time sync unavailable - showing last known orders
        </div>
        {orders && orders.map(order => (
          <div key={order.id} style={{
            backgroundColor: '#2E2E2E',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '8px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Order #{order.id}</div>
            <div style={{ fontSize: '12px', color: '#AAA' }}>
              {order.items?.join(', ') || 'No items'}
            </div>
          </div>
        ))}
        <button
          onClick={onRetry}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#E63946',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reconnect
        </button>
      </div>
    );
  },
  fallbackMessage: 'Kitchen display real-time sync unavailable'
};

// Analytics degradation strategy
export const analyticsStrategies = {
  healthCheck: async () => {
    // Check if analytics data is available
    const analyticsData = localStorage.getItem('cafeos_analytics');
    return !!analyticsData;
  },
  cachedComponent: function CachedAnalytics({ isCached }) {
    const cachedData = JSON.parse(localStorage.getItem('cafeos_analytics') || '{}');
    
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          📊 Analytics (Cached)
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
          {isCached && `Showing cached data from ${  new Date(cachedData.timestamp).toLocaleString()}`}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Sales</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              ₹{cachedData.totalSales?.toLocaleString() || '0'}
            </div>
          </div>
          <div style={{ backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Orders</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              {cachedData.totalOrders || '0'}
            </div>
          </div>
        </div>
      </div>
    );
  },
  fallbackMessage: 'Analytics data unavailable'
};

// Inventory sync degradation strategy
export const inventoryStrategies = {
  healthCheck: async () => {
    // Check if inventory sync is working
    const lastSync = localStorage.getItem('inventory_last_sync');
    if (!lastSync) return true;
    
    const syncAge = Date.now() - new Date(lastSync).getTime();
    // Consider unhealthy if sync is older than 1 hour
    return syncAge < 60 * 60 * 1000;
  },
  simplifiedComponent: function LocalInventory({ onRetry }) {
    const localInventory = JSON.parse(localStorage.getItem('cafeos_inventory') || '[]');
    
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          📦 Inventory (Local Mode)
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
          Sync unavailable - showing local inventory only
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {localInventory.slice(0, 10).map(item => (
            <div key={item.id} style={{
              backgroundColor: '#F8F9FA',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E63946' }}>
                ₹{item.price}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onRetry}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#E63946',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry Sync
        </button>
      </div>
    );
  },
  fallbackMessage: 'Inventory sync unavailable - using local data'
};

export default withGracefulDegradation;
